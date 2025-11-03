import Vehicle from "../models/vehicle.model.js";
import Booking from "../models/booking.model.js";

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

        if (vehicle.status !== "reserved") {
            console.log(`⚠️ Vehicle ${vehicle.plateNo} is not reserved (status: ${vehicle.status})`);
            return false;
        }

        // Update vehicle back to available
        const oldReservedBy = vehicle.reservedBy;
        vehicle.status = "available";
        vehicle.reservedBy = null;
        vehicle.reservedUntil = null;
        await vehicle.save();

        // Update booking status to expired (if exists and still pending)
        if (oldReservedBy) {
            const booking = await Booking.findById(oldReservedBy);
            if (booking && booking.status === "pending") {
                booking.status = "expired";
                await booking.save();
                console.log(`⏰ Booking ${booking.bookingCode} expired due to ${reason}`);
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
            status: "reserved",
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
            status: "reserved",
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
            status: "reserved"
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