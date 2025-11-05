import Vehicle from "../models/vehicle.model.js";
import Booking from "../models/booking.model.js";
import {
  VEHICLE_STATUS,
  BOOKING_STATUS,
} from "../constants/statusCodes.js";

/**
 * Service để quản lý reservation timeout
 * Tự động hết hạn reservation khi quá thời gian
 */

/**
 * Release một reservation cụ thể
 * Đổi vehicle từ "reserved" → "available" và booking thành "expired"
 */
export const releaseReservation = async (vehicleId, reason = "timeout") => {
    try {
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            console.log(`⚠️ Vehicle ${vehicleId} not found`);
            return false;
        }

        if (vehicle.status !== VEHICLE_STATUS.RESERVED) {
            console.log(`⚠️ Vehicle ${vehicle.plateNo} is not reserved (status: ${vehicle.status})`);
            return false;
        }

        // Update vehicle back to available
        const oldReservedBy = vehicle.reservedBy;
        vehicle.status = VEHICLE_STATUS.AVAILABLE;
        vehicle.reservedBy = null;
        vehicle.reservedUntil = null;
        await vehicle.save();

        // Update booking status to expired (if exists and still pending)
        if (oldReservedBy) {
            const booking = await Booking.findById(oldReservedBy);
            if (
              booking &&
              [BOOKING_STATUS.PENDING_APPROVAL, BOOKING_STATUS.WAITING_PAYMENT, BOOKING_STATUS.APPROVED].includes(
                booking.status
              )
            ) {
                const now = new Date();
                booking.statusHistory = booking.statusHistory ?? [];
                booking.statusHistory.push({
                  status: BOOKING_STATUS.PAYMENT_FAILED,
                  changedAt: now,
                  changedBy: null,
                  note: `Reservation released (${reason})`,
                });
                booking.paymentFailedAt = now;
                booking.statusHistory.push({
                  status: BOOKING_STATUS.CANCELLED,
                  changedAt: now,
                  changedBy: null,
                  note: "Auto cancel after reservation release",
                });
                booking.markModified?.("statusHistory");
                booking.status = BOOKING_STATUS.CANCELLED;
                booking.cancelledAt = now;
                booking.lastStatusChangedAt = now;
                await booking.save();
                console.log(`⏰ Booking ${booking.bookingCode} cancelled due to ${reason}`);
            }
        }

        console.log(`🔓 Vehicle ${vehicle.plateNo} released from reservation (${reason})`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to release reservation for vehicle ${vehicleId}:`, error.message);
        return false;
    }
};

/**
 * Kiểm tra và release tất cả reservations đã hết hạn
 */
export const checkExpiredReservations = async () => {
    try {
        const now = new Date();

        // Tìm tất cả vehicles có reservation đã hết hạn
        const expiredVehicles = await Vehicle.find({
            status: VEHICLE_STATUS.RESERVED,
            reservedUntil: { $lt: now }
        });

        if (expiredVehicles.length === 0) {
            console.log("✅ No expired reservations found");
            return;
        }

        console.log(`🔍 Found ${expiredVehicles.length} expired reservations`);

        // Release từng reservation
        for (const vehicle of expiredVehicles) {
            await releaseReservation(vehicle._id, "timeout");
        }

        console.log(`🔓 Released ${expiredVehicles.length} expired reservations`);

    } catch (error) {
        console.error("❌ Failed to check expired reservations:", error.message);
    }
};

/**
 * Manually release một reservation (dùng cho admin hoặc cancel booking)
 */
export const manualReleaseReservation = async (bookingId) => {
    try {
        // Tìm vehicle được reserve bởi booking này
        const vehicle = await Vehicle.findOne({
            status: VEHICLE_STATUS.RESERVED,
            reservedBy: bookingId
        });

        if (!vehicle) {
            console.log(`⚠️ No reserved vehicle found for booking ${bookingId}`);
            return false;
        }

        return await releaseReservation(vehicle._id, "manual_cancel");

    } catch (error) {
        console.error(`❌ Failed to manually release reservation for booking ${bookingId}:`, error.message);
        return false;
    }
};

/**
 * Kiểm tra reservation status của một booking
 */
export const getReservationStatus = async (bookingId) => {
    try {
        const vehicle = await Vehicle.findOne({
            reservedBy: bookingId,
            status: VEHICLE_STATUS.RESERVED
        });

        if (!vehicle) {
            return {
                hasReservation: false,
                message: "Booking không có reservation"
            };
        }

        const now = new Date();
        const timeLeft = vehicle.reservedUntil - now;
        const minutesLeft = Math.ceil(timeLeft / (1000 * 60));

        return {
            hasReservation: true,
            vehicle: {
                id: vehicle._id,
                plateNo: vehicle.plateNo,
                model: vehicle.model
            },
            reservedUntil: vehicle.reservedUntil,
            timeLeft: minutesLeft > 0 ? `${minutesLeft} phút` : "Đã hết hạn",
            expired: timeLeft <= 0
        };

    } catch (error) {
        console.error(`❌ Failed to get reservation status for booking ${bookingId}:`, error.message);
        return {
            hasReservation: false,
            message: "Lỗi kiểm tra reservation"
        };
    }
};

export default {
    releaseReservation,
    checkExpiredReservations,
    manualReleaseReservation,
    getReservationStatus
};
