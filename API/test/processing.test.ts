import { describe, expect, it } from "vitest";
import { runProcessing } from "../src/services/processingService.js";

describe("runProcessing – add_fields", () => {
    it("merges new fields into the payload", () => {
        const result = runProcessing(
            "add_fields",
            { add: { source: "webhook", version: 1 } },
            { event: "order.created" }
        );
        expect(result.output).toEqual({ event: "order.created", source: "webhook", version: 1 });
        expect(result.skipped).toBeUndefined();
    });

    it("overwrites an existing field", () => {
        const result = runProcessing("add_fields", { add: { event: "overridden" } }, { event: "original" });
        expect(result.output.event).toBe("overridden");
    });

    it("handles an empty add config without mutating payload", () => {
        const result = runProcessing("add_fields", { add: {} }, { event: "order.created" });
        expect(result.output).toEqual({ event: "order.created" });
    });
});

describe("runProcessing – transform", () => {
    it("picks only the specified fields", () => {
        const result = runProcessing(
            "transform",
            { pick: ["id", "type"] },
            { id: "1", type: "order", secret: "x" }
        );
        expect(result.output).toEqual({ id: "1", type: "order" });
        expect(result.output).not.toHaveProperty("secret");
    });

    it("ignores pick fields not present in the payload", () => {
        const result = runProcessing("transform", { pick: ["id", "missing"] }, { id: "1" });
        expect(result.output).toEqual({ id: "1" });
    });

    it("renames a field and removes the old key", () => {
        const result = runProcessing(
            "transform",
            { rename: { userId: "customerId" } },
            { userId: "u1", name: "Alice" }
        );
        expect(result.output).toHaveProperty("customerId", "u1");
        expect(result.output).not.toHaveProperty("userId");
        expect(result.output).toHaveProperty("name", "Alice");
    });

    it("uppercases string fields", () => {
        const result = runProcessing(
            "transform",
            { uppercase: ["status"] },
            { status: "pending", amount: 100 }
        );
        expect(result.output.status).toBe("PENDING");
        expect(result.output.amount).toBe(100);
    });

    it("leaves non-string fields unchanged when uppercasing", () => {
        const result = runProcessing("transform", { uppercase: ["amount"] }, { amount: 42 });
        expect(result.output.amount).toBe(42);
    });

    it("applies pick then rename in sequence", () => {
        const result = runProcessing(
            "transform",
            { pick: ["id", "userId"], rename: { userId: "customerId" } },
            { id: "1", userId: "u1", secret: "x" }
        );
        expect(result.output).toEqual({ id: "1", customerId: "u1" });
    });
});

describe("runProcessing – filter", () => {
    it("passes payload when the equals condition matches", () => {
        const result = runProcessing(
            "filter",
            { field: "eventType", equals: "order.created" },
            { eventType: "order.created" }
        );
        expect(result.skipped).toBeUndefined();
        expect(result.output).toEqual({ eventType: "order.created" });
    });

    it("marks skipped when the equals condition does not match", () => {
        const result = runProcessing(
            "filter",
            { field: "eventType", equals: "order.created" },
            { eventType: "order.updated" }
        );
        expect(result.skipped).toBe(true);
    });

    it("passes when the greaterThan condition is satisfied", () => {
        const result = runProcessing("filter", { field: "amount", greaterThan: 100 }, { amount: 150 });
        expect(result.skipped).toBeUndefined();
    });

    it("marks skipped when the greaterThan condition is not satisfied", () => {
        const result = runProcessing("filter", { field: "amount", greaterThan: 100 }, { amount: 50 });
        expect(result.skipped).toBe(true);
    });

    it("passes when the lessThan condition is satisfied", () => {
        const result = runProcessing("filter", { field: "amount", lessThan: 100 }, { amount: 50 });
        expect(result.skipped).toBeUndefined();
    });

    it("marks skipped when the lessThan condition is not satisfied", () => {
        const result = runProcessing("filter", { field: "amount", lessThan: 100 }, { amount: 200 });
        expect(result.skipped).toBe(true);
    });

    it("marks skipped when the field is absent and equals is checked", () => {
        const result = runProcessing("filter", { field: "missing", equals: "x" }, { other: "y" });
        expect(result.skipped).toBe(true);
    });

    it("passes through when greaterThan is checked against a non-number value", () => {
        // typeof value !== 'number' → numeric condition is skipped → falls through to return true
        const result = runProcessing("filter", { field: "amount", greaterThan: 100 }, { amount: "not-a-number" });
        expect(result.skipped).toBeUndefined();
    });
});

describe("runProcessing – remove_fields", () => {
    it("removes listed fields from payload", () => {
        const result = runProcessing(
            "remove_fields",
            { fields: ["password", "token"] },
            { id: "1", password: "secret", token: "abc" }
        );

        expect(result.output).toEqual({ id: "1" });
    });
});

describe("runProcessing – lowercase", () => {
    it("lowercases listed string fields", () => {
        const result = runProcessing(
            "lowercase",
            { fields: ["email", "country"] },
            { email: "USER@EXAMPLE.COM", country: "US", age: 30 }
        );

        expect(result.output).toEqual({ email: "user@example.com", country: "us", age: 30 });
    });
});

describe("runProcessing – mask_fields", () => {
    it("masks listed fields with provided mask", () => {
        const result = runProcessing(
            "mask_fields",
            { fields: ["cardNumber"], mask: "[REDACTED]" },
            { cardNumber: "4111111111111111", amount: 100 }
        );

        expect(result.output).toEqual({ cardNumber: "[REDACTED]", amount: 100 });
    });

    it("uses default mask when no mask is provided", () => {
        const result = runProcessing(
            "mask_fields",
            { fields: ["ssn"] },
            { ssn: "123-45-6789", name: "Alice" }
        );

        expect(result.output).toEqual({ ssn: "***", name: "Alice" });
    });
});
