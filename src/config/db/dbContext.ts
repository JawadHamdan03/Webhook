import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';


export const dbContext = drizzle(process.env.DATABASE_URL!);