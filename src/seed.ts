import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import dbContext from "./config/db/dbContext.js";
import { pipelines, subscribers, users } from "./config/db/schema.js";

const makeSourceKey = () => `pl_${randomBytes(8).toString("hex")}`;

const seed = async () => {
    await dbContext.delete(users);
    await dbContext.delete(subscribers);
    await dbContext.delete(pipelines);

    const defaultPassword = await bcrypt.hash("password123", 10);
    await dbContext.insert(users).values({
        email: "admin@example.com",
        password: defaultPassword
    });

    const createdPipelines = await dbContext
        .insert(pipelines)
        .values([
            {
                name: "Orders pipeline",
                sourceKey: makeSourceKey(),
                actionType: "filter",
                actionConfig: { field: "eventType", equals: "order.created" }
            },
            {
                name: "User events pipeline",
                sourceKey: makeSourceKey(),
                actionType: "add_fields",
                actionConfig: { add: { processedBy: "seed" } }
            }
        ])
        .returning();

    const [ordersPipeline, userPipeline] = createdPipelines;

    if (!ordersPipeline || !userPipeline) {
        throw new Error("Seed failed to create pipelines");
    }

    await dbContext.insert(subscribers).values([
        {
            pipelineId: ordersPipeline.id,
            targetUrl: "https://example.com/webhook/orders"
        },
        {
            pipelineId: ordersPipeline.id,
            targetUrl: "https://example.com/webhook/orders-secondary"
        },
        {
            pipelineId: userPipeline.id,
            targetUrl: "https://example.com/webhook/users"
        }
    ]);

    console.log("Seed complete", {
        defaultUser: {
            email: "admin@example.com",
            password: "password123"
        },
        pipelines: createdPipelines.map((pipeline) => ({
            id: pipeline.id,
            sourceKey: pipeline.sourceKey,
            name: pipeline.name
        }))
    });
};

seed()
    .catch((error) => {
        console.error("Seed failed", error);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
