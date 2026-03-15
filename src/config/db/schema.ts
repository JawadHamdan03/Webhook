import {
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid
} from "drizzle-orm/pg-core";

export const actionTypeEnum = pgEnum("action_type", ["add_fields", "transform", "filter"]);
export const jobStatusEnum = pgEnum("job_status", ["pending", "processing", "completed", "failed"]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["pending", "success", "failed"]);

export const pipelines = pgTable("pipelines", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    sourceKey: text("source_key").notNull().unique(),
    actionType: actionTypeEnum("action_type").notNull(),
    actionConfig: jsonb("action_config").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const subscribers = pgTable("subscribers", {
    id: uuid("id").defaultRandom().primaryKey(),
    pipelineId: uuid("pipeline_id")
        .notNull()
        .references(() => pipelines.id, { onDelete: "cascade" }),
    targetUrl: text("target_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const jobs = pgTable("jobs", {
    id: uuid("id").defaultRandom().primaryKey(),
    pipelineId: uuid("pipeline_id")
        .notNull()
        .references(() => pipelines.id, { onDelete: "cascade" }),
    status: jobStatusEnum("status").notNull().default("pending"),
    payload: jsonb("payload").notNull(),
    processedOutput: jsonb("processed_output"),
    errorMessage: text("error_message"),
    attemptCount: integer("attempt_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true })
});

export const deliveryAttempts = pgTable("delivery_attempts", {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
        .notNull()
        .references(() => jobs.id, { onDelete: "cascade" }),
    subscriberId: uuid("subscriber_id")
        .notNull()
        .references(() => subscribers.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    status: deliveryStatusEnum("status").notNull().default("pending"),
    responseStatus: integer("response_status"),
    responseBody: text("response_body"),
    errorMessage: text("error_message"),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});



