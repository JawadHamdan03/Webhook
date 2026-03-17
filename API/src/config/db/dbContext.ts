import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';


const dbContext = drizzle(process.env.DATABASE_URL!);
export default dbContext