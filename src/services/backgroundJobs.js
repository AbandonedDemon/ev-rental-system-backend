import cron from "node-cron";
import Booking from "../models/booking.model.js";
import Rental from "../models/rental.model.js";
import Vehicle from "../models/vehicle.model.js";
import Payment from "../models/payment.model.js";
import {
  checkExpiredReservations,
  manualReleaseReservation,
} from "./reservationService.js";
import {
  applyRentalStatus,
  updateVehicleByRentalStatus,
} from "./rentalStatus.js";
import {
  BOOKING_STATUS,
  RENTAL_STATUS,
  VEHICLE_STATUS,
  PAYMENT_STATUS,
} from "../constants/statusCodes.js";

/**
 * Background jobs để quản lý hệ thống
 */

let jobs = new Map();

const handleBookingPaymentTimeouts = async () => {
  const now = new Date();

  const bookings = await Booking.find({
    status: BOOKING_STATUS.WAITING_PAYMENT,
    $or: [
      { paymentDueAt: { $ne: null, $lt: now } },
      { reservationExpiresAt: { $ne: null, $lt: now } },
    ],
  });

  if (!bookings.length) {
    return;
  }

  console.log(`⏳ [CRON] ${bookings.length} bookings waiting payment past deadline`);

  for (const booking of bookings) {
    try {
      const released = await manualReleaseReservation(booking._id);
      if (released) {
        continue;
      }

      const timestamp = new Date();
      booking.statusHistory = booking.statusHistory ?? [];
      booking.statusHistory.push({
        status: BOOKING_STATUS.PAYMENT_FAILED,
        changedAt: timestamp,
        changedBy: null,
        note: "Payment deadline exceeded",
      });
      booking.paymentFailedAt = timestamp;
      booking.statusHistory.push({
        status: BOOKING_STATUS.CANCELLED,
        changedAt: timestamp,
        changedBy: null,
        note: "Auto cancelled after payment timeout",
      });
      booking.markModified?.("statusHistory");
      booking.status = BOOKING_STATUS.CANCELLED;
      booking.cancelledAt = timestamp;
      booking.lastStatusChangedAt = timestamp;
      booking.reservationExpiresAt = null;
      await booking.save();
    } catch (error) {
      console.error(`❌ Failed to timeout booking ${booking._id}:`, error.message);
    }
  }
};

const createRentalFromPaidBooking = async (booking) => {
  try {
    if (!booking.vehicle) {
      console.warn(`⚠️ Booking ${booking._id} is paid but has no vehicle assigned.`);
      return;
    }

    const vehicle = await Vehicle.findById(booking.vehicle);
    if (!vehicle) {
      console.warn(`⚠️ Vehicle ${booking.vehicle} not found for booking ${booking._id}`);
      return;
    }

    const paidPayments = await Payment.find({
      booking: booking._id,
      status: PAYMENT_STATUS.SUCCESS,
    });

    const paidAmount = paidPayments.reduce(
      (sum, payment) => sum + Number(payment.totalAmount ?? 0),
      0
    );

    const baseAmount = Number(booking.basePrice ?? 0);
    const depositAmount = Number(booking.depositAmount ?? 0);
    const surchargeAmount = Number(booking.additionalFees ?? 0);
    const totalAmount = Number(booking.totalPayable ?? baseAmount + depositAmount + surchargeAmount);

    const now = new Date();
    const rental = await Rental.create({
      booking: booking._id,
      renter: booking.renter,
      vehicle: vehicle._id,
      pickupStation: booking.pickupStation,
      baseAmount,
      depositAmount,
      surchargeAmount,
      totalAmount,
      paidAmount,
      extraCharges: 0,
      extraChargeNotes: null,
      lateDays: 0,
      lateFeeAmount: 0,
      amountDue: 0,
      refundAmount: 0,
      plannedPickupTime: booking.pickupDateTime ?? null,
      plannedReturnTime: booking.returnDateTime ?? null,
      status: RENTAL_STATUS.CREATED,
      statusHistory: [],
    });

    applyRentalStatus(rental, RENTAL_STATUS.CREATED, {
      userId: null,
      note: "Rental auto-created by scheduler",
      timestamp: now,
    });

    applyRentalStatus(rental, RENTAL_STATUS.READY_FOR_PICKUP, {
      userId: null,
      note: "Vehicle ready for pickup",
      timestamp: now,
    });

    await rental.save();

    const pickupStationRef = booking.pickupStation?.code ?? booking.pickupStation;
    updateVehicleByRentalStatus(
      vehicle,
      RENTAL_STATUS.READY_FOR_PICKUP,
      pickupStationRef,
    );
    if (pickupStationRef) {
      vehicle.stationId = pickupStationRef;
    }
    await vehicle.save();

    await Payment.updateMany(
      { booking: booking._id, status: PAYMENT_STATUS.SUCCESS, rental: null },
      { rental: rental._id }
    );

    booking.statusHistory = booking.statusHistory ?? [];
    booking.statusHistory.push({
      status: BOOKING_STATUS.SUCCESS,
      changedAt: now,
      changedBy: null,
      note: "Rental auto-created by scheduler",
    });
    booking.markModified?.("statusHistory");
    booking.status = BOOKING_STATUS.SUCCESS;
    booking.successAt = now;
    booking.lastStatusChangedAt = now;
    await booking.save();

    console.log(`🚗 Auto-created rental ${rental._id} for booking ${booking.bookingCode ?? booking._id}`);
  } catch (error) {
    console.error(`❌ Failed to create rental for booking ${booking._id}:`, error.message);
  }
};

const handlePaidBookingsWithoutRental = async () => {
  const bookings = await Booking.find({
    status: BOOKING_STATUS.PAID,
  })
    .populate([{ path: "pickupStation" }, { path: "renter" }, { path: "brand" }])
    .limit(25);

  if (!bookings.length) {
    return;
  }

  const bookingIds = bookings.map((b) => b._id);
  const rentals = await Rental.find({ booking: { $in: bookingIds } }).select("booking");
  const bookedSet = new Set(rentals.map((r) => r.booking.toString()));

  for (const booking of bookings) {
    if (bookedSet.has(booking._id.toString())) {
      continue;
    }
    await createRentalFromPaidBooking(booking);
  }
};

const markLateRentals = async () => {
  const now = new Date();
  const rentals = await Rental.find({
    status: RENTAL_STATUS.IN_PROGRESS,
    plannedReturnTime: { $ne: null, $lt: now },
  });

  if (!rentals.length) {
    return;
  }

  console.log(`⏰ [CRON] Marking ${rentals.length} rentals as late`);

  for (const rental of rentals) {
    try {
      applyRentalStatus(rental, RENTAL_STATUS.LATE, {
        userId: null,
        note: "Rental overdue automatically",
        timestamp: now,
      });
      await rental.save();
    } catch (error) {
      console.error(`❌ Failed to mark rental ${rental._id} late:`, error.message);
    }
  }
};

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

    // Job 2: Kiểm tra booking quá hạn thanh toán mỗi 5 phút
    const bookingPaymentJob = cron.schedule("*/5 * * * *", async () => {
        console.log("⏳ [CRON] Checking booking payment deadlines...");
        await handleBookingPaymentTimeouts();
    }, {
        scheduled: false,
        name: "booking-payment-deadlines",
        timezone: "Asia/Ho_Chi_Minh"
    });

    // Job 3: Auto create rentals cho booking đã thanh toán mỗi 5 phút
    const rentalCreationJob = cron.schedule("*/5 * * * *", async () => {
        console.log("🛠 [CRON] Ensuring rentals exist for paid bookings...");
        await handlePaidBookingsWithoutRental();
    }, {
        scheduled: false,
        name: "paid-booking-rental",
        timezone: "Asia/Ho_Chi_Minh"
    });

    // Job 4: Đánh dấu rental trễ hạn mỗi 10 phút
    const lateRentalJob = cron.schedule("*/10 * * * *", async () => {
        console.log("⏰ [CRON] Checking late rentals...");
        await markLateRentals();
    }, {
        scheduled: false,
        name: "late-rentals",
        timezone: "Asia/Ho_Chi_Minh"
    });

    // Job 5: Cleanup log mỗi ngày lúc 2h sáng (optional)
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
    bookingPaymentJob.start();
    rentalCreationJob.start();
    lateRentalJob.start();
    cleanupJob.start();

    // Lưu reference để có thể stop later
    jobs.set("expired-reservations", expiredReservationJob);
    jobs.set("booking-payment-deadlines", bookingPaymentJob);
    jobs.set("paid-booking-rental", rentalCreationJob);
    jobs.set("late-rentals", lateRentalJob);
    jobs.set("daily-cleanup", cleanupJob);

    console.log("✅ Background jobs started:");
    console.log("  - Expired reservations check: Every 5 minutes");
    console.log("  - Booking payment timeout check: Every 5 minutes");
    console.log("  - Paid booking rental creation: Every 5 minutes");
    console.log("  - Late rental detection: Every 10 minutes");
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
