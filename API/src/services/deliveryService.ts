import { sql } from "drizzle-orm";
import dbContext from "../config/db/dbContext.js";
import { deliveryAttempts, subscribers } from "../config/db/schema.js";

type DeliveryAttemptRow = {
    attempt_id: string;
    attempt_number: number;
    job_id: string;
    subscriber_id: string;
    target_url: string;
    processed_output: Record<string, unknown> | null;
};

type DeliveryAttemptInsert = typeof deliveryAttempts.$inferInsert;

const retryDelaysSeconds = [10, 30, 60];
const maxAttempts = 1 + retryDelaysSeconds.length;

const getNextRetryAt = (attemptNumber: number) => {
    const index = attemptNumber - 1;
    if (index < 1 || index > retryDelaysSeconds.length) {
        return null;
    }

    const delaySeconds = retryDelaysSeconds[index - 1];
    return new Date(Date.now() + delaySeconds! * 1000);
};

export const createInitialDeliveryAttempts = async (jobId: string, pipelineId: string) => {
    const rows = await dbContext.select().from(subscribers).where(sql`${subscribers.pipelineId} = ${pipelineId}`);

    if (rows.length === 0) {
        return [];
    }

    const attempts: DeliveryAttemptInsert[] = rows.map((subscriber) => ({
        jobId,
        subscriberId: subscriber.id,
        attemptNumber: 1,
        status: "pending",
        nextRetryAt: new Date()
    }));

    return dbContext.insert(deliveryAttempts).values(attempts);
};

export const claimNextDeliveryAttempt = async () => {
    return dbContext.transaction(async (tx) => {
        const result = await tx.execute(sql<DeliveryAttemptRow>`
            SELECT da.id AS attempt_id,
                   da.attempt_number,
                   da.job_id,
                   da.subscriber_id,
                   s.target_url,
                   j.processed_output
            FROM delivery_attempts da
            JOIN subscribers s ON s.id = da.subscriber_id
            JOIN jobs j ON j.id = da.job_id
            WHERE da.status = 'pending'
              AND (da.next_retry_at IS NULL OR da.next_retry_at <= NOW())
            ORDER BY da.created_at
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        `);

        const rows = result.rows as DeliveryAttemptRow[];
        const attempt = rows[0];

        if (!attempt) {
            return null;
        }

        return attempt;
    });
};

export const markDeliverySuccess = async (
    attemptId: string,
    responseStatus: number,
    responseBody: string | null
) => {
    await dbContext
        .update(deliveryAttempts)
        .set({
            status: "success",
            responseStatus,
            responseBody,
            updatedAt: new Date()
        })
        .where(sql`${deliveryAttempts.id} = ${attemptId}`);
};

export const markDeliveryFailure = async (
    attemptId: string,
    responseStatus: number | null,
    responseBody: string | null,
    errorMessage: string | null
) => {
    await dbContext
        .update(deliveryAttempts)
        .set({
            status: "failed",
            responseStatus,
            responseBody,
            errorMessage,
            updatedAt: new Date()
        })
        .where(sql`${deliveryAttempts.id} = ${attemptId}`);
};

export const scheduleRetry = async (attempt: DeliveryAttemptRow) => {
    if (attempt.attempt_number >= maxAttempts) {
        return false;
    }

    const nextAttemptNumber = attempt.attempt_number + 1;
    const nextRetryAt = getNextRetryAt(nextAttemptNumber);

    await dbContext.insert(deliveryAttempts).values({
        jobId: attempt.job_id,
        subscriberId: attempt.subscriber_id,
        attemptNumber: nextAttemptNumber,
        status: "pending",
        nextRetryAt
    });

    return true;
};

export const deliverToSubscriber = async (targetUrl: string, payload: Record<string, unknown>) => {
    const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const responseBody = await response.text().catch(() => null);

    return { response, responseBody };
};
