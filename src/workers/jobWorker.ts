import { sql } from "drizzle-orm";
import dbContext from "../config/db/dbContext.js";
import { jobs } from "../config/db/schema.js";
import {
    claimNextDeliveryAttempt,
    createInitialDeliveryAttempts,
    deliverToSubscriber,
    markDeliveryFailure,
    markDeliverySuccess,
    scheduleRetry
} from "../services/deliveryService.js";
import { runProcessing } from "../services/processingService.js";

type JobRow = {
    id: string;
    pipeline_id: string;
    payload: Record<string, unknown>;
    action_type: "add_fields" | "transform" | "filter";
    action_config: Record<string, unknown>;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const claimNextJob = async () => {
    return dbContext.transaction(async (tx) => {
        const result = await tx.execute(sql<JobRow>`
            SELECT j.id, j.pipeline_id, j.payload, p.action_type, p.action_config
            FROM jobs j
            JOIN pipelines p ON p.id = j.pipeline_id
            WHERE j.status = 'pending'
            ORDER BY j.created_at
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        `);

        const rows = result.rows as JobRow[];
        const job = rows[0];

        if (!job) {
            return null;
        }

        await tx.update(jobs)
            .set({ status: "processing", updatedAt: new Date() })
            .where(sql`${jobs.id} = ${job.id}`);

        return job;
    });
};

const markJobSuccess = async (jobId: string, output: Record<string, unknown>) => {
    await dbContext.update(jobs)
        .set({
            status: "completed",
            processedOutput: output,
            processedAt: new Date(),
            updatedAt: new Date()
        })
        .where(sql`${jobs.id} = ${jobId}`);
};

const markJobFailure = async (jobId: string, errorMessage: string) => {
    await dbContext.update(jobs)
        .set({
            status: "failed",
            errorMessage,
            updatedAt: new Date()
        })
        .where(sql`${jobs.id} = ${jobId}`);
};

export const startWorker = async (pollIntervalMs = 1000) => {
    console.log(`Worker started, polling every ${pollIntervalMs}ms`);

    while (true) {
        try {
            const job = await claimNextJob();
            if (job) {
                const result = runProcessing(job.action_type, job.action_config, job.payload);
                await markJobSuccess(job.id, result.output);
                await createInitialDeliveryAttempts(job.id, job.pipeline_id);
                continue;
            }

            const deliveryAttempt = await claimNextDeliveryAttempt();
            if (deliveryAttempt) {
                const payload = deliveryAttempt.processed_output || {};
                try {
                    const { response, responseBody } = await deliverToSubscriber(
                        deliveryAttempt.target_url,
                        payload
                    );

                    if (response.ok) {
                        await markDeliverySuccess(
                            deliveryAttempt.attempt_id,
                            response.status,
                            responseBody
                        );
                    } else {
                        await markDeliveryFailure(
                            deliveryAttempt.attempt_id,
                            response.status,
                            responseBody,
                            `delivery_failed_${response.status}`
                        );
                        await scheduleRetry(deliveryAttempt);
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : "delivery_failed";
                    await markDeliveryFailure(deliveryAttempt.attempt_id, null, null, message);
                    await scheduleRetry(deliveryAttempt);
                }

                continue;
            }

            await sleep(pollIntervalMs);
        } catch (error) {
            console.error("Worker error", error);
            await sleep(pollIntervalMs);
        }
    }
};
