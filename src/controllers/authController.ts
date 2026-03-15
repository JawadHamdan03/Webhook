import { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail, verifyPassword } from "../services/authService.js";
import { loginSchema, registerSchema } from "../validators/auth.js";

const signToken = (userId: string, email: string) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not set");
    }

    return jwt.sign({ sub: userId, email }, secret, { expiresIn: "1d" });
};

export const register = async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "invalid_request" });
        return;
    }

    const existing = await findUserByEmail(parsed.data.email);
    if (existing) {
        res.status(409).json({ error: "email_in_use" });
        return;
    }

    const user = await createUser(parsed.data.email, parsed.data.password);
    if (!user) {
        res.status(500).json({ error: "server_error" });
        return;
    }

    const token = signToken(user.id, user.email);
    res.status(201).json({ token });
};

export const login = async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "invalid_request" });
        return;
    }

    const user = await findUserByEmail(parsed.data.email);
    if (!user) {
        res.status(401).json({ error: "invalid_credentials" });
        return;
    }

    const ok = await verifyPassword(parsed.data.password, user.password);
    if (!ok) {
        res.status(401).json({ error: "invalid_credentials" });
        return;
    }

    const token = signToken(user.id, user.email);
    res.status(200).json({ token });
};
