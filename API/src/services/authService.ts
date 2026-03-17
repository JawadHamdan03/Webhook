import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import dbContext from "../config/db/dbContext.js";
import { users } from "../config/db/schema.js";

export const createUser = async (email: string, password: string) => {
    const hashed = await bcrypt.hash(password, 10);
    const rows = await dbContext.insert(users).values({
        email,
        password: hashed
    }).returning();

    return rows[0] ?? null;
};

export const findUserByEmail = async (email: string) => {
    const rows = await dbContext.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] ?? null;
};

export const verifyPassword = async (password: string, hashed: string) => {
    return bcrypt.compare(password, hashed);
};
