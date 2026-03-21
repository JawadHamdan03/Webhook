type ActionType = "add_fields" | "transform" | "filter" | "remove_fields" | "lowercase" | "mask_fields";

type ProcessingResult = {
    output: Record<string, unknown>;
    skipped?: boolean;
    reason?: string;
};

const asRecord = (value: unknown) => (value && typeof value === "object" ? (value as Record<string, unknown>) : {});

const applyAddFields = (payload: Record<string, unknown>, config: Record<string, unknown>) => {
    const add = asRecord(config.add);
    return { ...payload, ...add };
};

const applyTransform = (payload: Record<string, unknown>, config: Record<string, unknown>) => {
    let nextPayload: Record<string, unknown> = { ...payload };

    const pick = Array.isArray(config.pick) ? (config.pick as string[]) : null;
    if (pick) {
        nextPayload = pick.reduce<Record<string, unknown>>((acc, key) => {
            if (key in payload) {
                acc[key] = payload[key];
            }
            return acc;
        }, {});
    }

    const rename = asRecord(config.rename);
    Object.entries(rename).forEach(([fromKey, toValue]) => {
        const toKey = String(toValue);
        if (fromKey in nextPayload) {
            nextPayload[toKey] = nextPayload[fromKey];
            delete nextPayload[fromKey];
        }
    });

    const uppercase = Array.isArray(config.uppercase) ? (config.uppercase as string[]) : [];
    uppercase.forEach((key) => {
        const value = nextPayload[key];
        if (typeof value === "string") {
            nextPayload[key] = value.toUpperCase();
        }
    });

    return nextPayload;
};

const applyFilter = (payload: Record<string, unknown>, config: Record<string, unknown>) => {
    const field = typeof config.field === "string" ? config.field : null;
    if (!field) {
        return true;
    }

    const value = payload[field];
    if (config.equals !== undefined) {
        return value === config.equals;
    }
    if (typeof config.greaterThan === "number" && typeof value === "number") {
        return value > config.greaterThan;
    }
    if (typeof config.lessThan === "number" && typeof value === "number") {
        return value < config.lessThan;
    }

    return true;
};

const applyRemoveFields = (payload: Record<string, unknown>, config: Record<string, unknown>) => {
    const fields = Array.isArray(config.fields) ? (config.fields as string[]) : [];
    const nextPayload = { ...payload };

    fields.forEach((field) => {
        delete nextPayload[field];
    });

    return nextPayload;
};

const applyLowercase = (payload: Record<string, unknown>, config: Record<string, unknown>) => {
    const fields = Array.isArray(config.fields) ? (config.fields as string[]) : [];
    const nextPayload = { ...payload };

    fields.forEach((field) => {
        const value = nextPayload[field];
        if (typeof value === "string") {
            nextPayload[field] = value.toLowerCase();
        }
    });

    return nextPayload;
};

const applyMaskFields = (payload: Record<string, unknown>, config: Record<string, unknown>) => {
    const fields = Array.isArray(config.fields) ? (config.fields as string[]) : [];
    const mask = typeof config.mask === "string" ? config.mask : "***";
    const nextPayload = { ...payload };

    fields.forEach((field) => {
        if (field in nextPayload) {
            nextPayload[field] = mask;
        }
    });

    return nextPayload;
};

export const runProcessing = (
    actionType: ActionType,
    actionConfig: Record<string, unknown>,
    payload: Record<string, unknown>
): ProcessingResult => {
    if (actionType === "add_fields") {
        return { output: applyAddFields(payload, actionConfig) };
    }

    if (actionType === "transform") {
        return { output: applyTransform(payload, actionConfig) };
    }

    if (actionType === "remove_fields") {
        return { output: applyRemoveFields(payload, actionConfig) };
    }

    if (actionType === "lowercase") {
        return { output: applyLowercase(payload, actionConfig) };
    }

    if (actionType === "mask_fields") {
        return { output: applyMaskFields(payload, actionConfig) };
    }

    const passed = applyFilter(payload, actionConfig);
    if (!passed) {
        return { output: { skipped: true, reason: "filter_not_matched" }, skipped: true };
    }

    return { output: payload };
};
