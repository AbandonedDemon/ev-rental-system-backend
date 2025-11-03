import cron from "node-cron";
import { checkExpiredReservations } from "./reservationService.js";

/**
 * Background jobs để quản lý hệ thống
 */

let jobs = new Map();

/**
 * Khởi tạo tất cả background jobs
 */
export const startBackgroundJobs = () => {
    console.log("🚀 Starting background jobs...");

    // Job 1: Kiểm tra expired reservations mỗi 5 phút
    const expiredReservationJob = cron.schedule("*/5 * * * *", async () => {
        console.log("🔍 [CRON] Checking expired reservations...");
        await checkExpiredReservations();
    }, {
        scheduled: false,
        name: "expired-reservations",
        timezone: "Asia/Ho_Chi_Minh"
    });

    // Job 2: Cleanup log mỗi ngày lúc 2h sáng (optional)
    const cleanupJob = cron.schedule("0 2 * * *", () => {
        console.log("🧹 [CRON] Daily cleanup tasks...");
        // TODO: Implement log cleanup, temp file cleanup, etc.
    }, {
        scheduled: false,
        name: "daily-cleanup",
        timezone: "Asia/Ho_Chi_Minh"
    });

    // Bắt đầu các jobs
    expiredReservationJob.start();
    cleanupJob.start();

    // Lưu reference để có thể stop later
    jobs.set("expired-reservations", expiredReservationJob);
    jobs.set("daily-cleanup", cleanupJob);

    console.log("✅ Background jobs started:");
    console.log("  - Expired reservations check: Every 5 minutes");
    console.log("  - Daily cleanup: Every day at 2:00 AM");
};

/**
 * Dừng tất cả background jobs
 */
export const stopBackgroundJobs = () => {
    console.log("🛑 Stopping background jobs...");

    jobs.forEach((job, name) => {
        job.stop();
        console.log(`  - Stopped: ${name}`);
    });

    jobs.clear();
    console.log("✅ All background jobs stopped");
};

/**
 * Restart một job cụ thể
 */
export const restartJob = (jobName) => {
    if (jobs.has(jobName)) {
        jobs.get(jobName).stop();
        jobs.get(jobName).start();
        console.log(`🔄 Restarted job: ${jobName}`);
    } else {
        console.log(`⚠️ Job not found: ${jobName}`);
    }
};

/**
 * Get status of all jobs
 */
export const getJobStatus = () => {
    const status = {};
    jobs.forEach((job, name) => {
        status[name] = {
            running: job.running,
            scheduled: job.scheduled
        };
    });
    return status;
};

// Graceful shutdown
process.on("SIGINT", () => {
    console.log("\n🛑 Received SIGINT, stopping background jobs...");
    stopBackgroundJobs();
    process.exit(0);
});

process.on("SIGTERM", () => {
    console.log("\n🛑 Received SIGTERM, stopping background jobs...");
    stopBackgroundJobs();
    process.exit(0);
});

export default {
    startBackgroundJobs,
    stopBackgroundJobs,
    restartJob,
    getJobStatus
};