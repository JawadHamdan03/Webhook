import { z } from "zod";

const sourceKeySchema = z.string().regex(/^pl_[a-f0-9]{8,}$/i, {
    message: "invalid_source_key"
});

const addFieldsConfigSchema = z.object({
    add: z.record(z.string(), z.unknown())
});

const transformConfigSchema = z
    .object({
        pick: z.array(z.string()).optional(),
        rename: z.record(z.string(), z.string()).optional(),
        uppercase: z.array(z.string()).optional()
    })
    .refine((data) => Boolean(data.pick || data.rename || data.uppercase), {
        message: "transform_requires_rule"
    });

const filterConfigSchema = z
    .object({
        field: z.string().min(1),
        equals: z.unknown().optional(),
        greaterThan: z.number().optional(),
        lessThan: z.number().optional()
    })
    .refine((data) => data.equals !== undefined || data.greaterThan !== undefined || data.lessThan !== undefined, {
        message: "filter_requires_condition"
    });

const pipelineConfigSchema = z.discriminatedUnion("actionType", [
    z.object({
        actionType: z.literal("add_fields"),
        actionConfig: addFieldsConfigSchema
    }),
    z.object({
        actionType: z.literal("transform"),
        actionConfig: transformConfigSchema
    }),
    z.object({
        actionType: z.literal("filter"),
        actionConfig: filterConfigSchema
    })
]);

export const pipelineCreateSchema = z
    .object({
        name: z.string().min(1),
        sourceKey: sourceKeySchema.optional()
    })
    .and(pipelineConfigSchema);

export const pipelineUpdateSchema = z
    .object({
        name: z.string().min(1).optional(),
        sourceKey: sourceKeySchema.optional(),
        actionType: z.enum(["add_fields", "transform", "filter"]).optional(),
        actionConfig: z.record(z.string(), z.unknown()).optional()
    })
    .superRefine((data, ctx) => {
        if (Object.keys(data).length === 0) {
            ctx.addIssue({ code: "custom", message: "at_least_one_field_required" });
            return;
        }

        if (data.actionConfig && !data.actionType) {
            ctx.addIssue({ code: "custom", message: "actionType_required_with_actionConfig" });
            return;
        }

        if (!data.actionType) {
            return;
        }

        const result = pipelineConfigSchema.safeParse({
            actionType: data.actionType,
            actionConfig: data.actionConfig
        });

        if (!result.success) {
            ctx.addIssue({ code: "custom", message: "invalid_action_config" });
        }
    });
