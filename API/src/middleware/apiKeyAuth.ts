import { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";

const getBearerToken = (req: Request) => {
    const authHeader = req.header("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.slice("Bearer ".length).trim();
    }

    return null;
};

export const jwtAuth = (req: Request, res: Response, next: NextFunction) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        res.status(500).json({ error: "server_misconfigured" });
        return;
    }

    const token = getBearerToken(req);
    if (!token) {
        res.status(401).json({ error: "unauthorized" });
        return;
    }

    try {
        const decoded = jwt.verify(token, secret);
        (req as { user?: unknown }).user = decoded;
        next();
    } catch {
        res.status(401).json({ error: "unauthorized" });
    }
};
