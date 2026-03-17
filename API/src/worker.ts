import "dotenv/config";
import { startWorker } from "./workers/jobWorker.js";

startWorker().catch((error) => {
    console.error("Worker crashed", error);
    process.exit(1);
});
