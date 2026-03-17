import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import * as authService from "../src/services/authService.js";

vi.mock("../src/services/authService.js", () => ({
    findUserByEmail: vi.fn(),
    createUser: vi.fn(),
    verifyPassword: vi.fn(),
}));

const mockUser = {
    id: "user-1",
    email: "test@example.com",
    password: "hashed-password",
    createdAt: new Date(),
    updatedAt: new Date(),
};

beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    vi.clearAllMocks();
});

describe("POST /auth/register", () => {
    it("returns 400 for missing email", async () => {
        const res = await request(app).post("/auth/register").send({ password: "password123" });
        expect(res.status).toBe(400);
    });

    it("returns 400 for missing password", async () => {
        const res = await request(app).post("/auth/register").send({ email: "test@example.com" });
        expect(res.status).toBe(400);
    });

    it("returns 400 for password shorter than 6 characters", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({ email: "test@example.com", password: "abc" });
        expect(res.status).toBe(400);
    });

    it("returns 400 for invalid email format", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({ email: "not-an-email", password: "password123" });
        expect(res.status).toBe(400);
    });

    it("returns 409 when email is already in use", async () => {
        vi.mocked(authService.findUserByEmail).mockResolvedValue(mockUser);

        const res = await request(app)
            .post("/auth/register")
            .send({ email: "test@example.com", password: "password123" });
        expect(res.status).toBe(409);
        expect(res.body.error).toBe("email_in_use");
    });

    it("returns 201 with a JWT token on successful registration", async () => {
        vi.mocked(authService.findUserByEmail).mockResolvedValue(null);
        vi.mocked(authService.createUser).mockResolvedValue(mockUser);

        const res = await request(app)
            .post("/auth/register")
            .send({ email: "test@example.com", password: "password123" });
        expect(res.status).toBe(201);
        expect(typeof res.body.token).toBe("string");
        expect(res.body.token.length).toBeGreaterThan(0);
    });
});

describe("POST /auth/login", () => {
    it("returns 400 for empty body", async () => {
        const res = await request(app).post("/auth/login").send({});
        expect(res.status).toBe(400);
    });

    it("returns 400 for missing password", async () => {
        const res = await request(app).post("/auth/login").send({ email: "test@example.com" });
        expect(res.status).toBe(400);
    });

    it("returns 401 when email is not found", async () => {
        vi.mocked(authService.findUserByEmail).mockResolvedValue(null);

        const res = await request(app)
            .post("/auth/login")
            .send({ email: "unknown@example.com", password: "password123" });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("invalid_credentials");
    });

    it("returns 401 when password is incorrect", async () => {
        vi.mocked(authService.findUserByEmail).mockResolvedValue(mockUser);
        vi.mocked(authService.verifyPassword).mockResolvedValue(false);

        const res = await request(app)
            .post("/auth/login")
            .send({ email: "test@example.com", password: "wrongpassword" });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("invalid_credentials");
    });

    it("returns 200 with a JWT token on successful login", async () => {
        vi.mocked(authService.findUserByEmail).mockResolvedValue(mockUser);
        vi.mocked(authService.verifyPassword).mockResolvedValue(true);

        const res = await request(app)
            .post("/auth/login")
            .send({ email: "test@example.com", password: "password123" });
        expect(res.status).toBe(200);
        expect(typeof res.body.token).toBe("string");
        expect(res.body.token.length).toBeGreaterThan(0);
    });
});
