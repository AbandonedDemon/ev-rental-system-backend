import mongoose from "mongoose";
import Booking from "../models/booking.model.js";
import Vehicle from "../models/vehicle.model.js";
import {
  BOOKING_STATUS,
  VEHICLE_STATUS,
  RESERVATION_HOLD_MINUTES,
} from "../constants/statusCodes.js";

/**
 * Confirms a pending booking by validating vehicle availability and updating booking status
 * @param {string} bookingId - The ID of the booking to confirm
 * @returns {Promise<Object>} The updated booking object
 * @throws {Error} When booking validation fails
 */
export const confirmBookingOnPending = async (bookingId) => {
  const session = await mongoose.startSession();
  try {
    let updated;
    await session.withTransaction(async () => {
      const booking = await Booking.findById(bookingId).session(session);

      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.status === BOOKING_STATUS.WAITING_PAYMENT) {
        updated = booking;
        return;
      }

      if (booking.status === BOOKING_STATUS.PAID || booking.status === BOOKING_STATUS.SUCCESS) {
        updated = booking;
        return;
      }

      if (booking.status !== BOOKING_STATUS.PENDING_APPROVAL && booking.status !== BOOKING_STATUS.APPROVED) {
        throw new Error("Booking is not in a confirmable status");
      }

      if (!booking.vehicle) {
        throw new Error("No vehicle assigned to booking");
      }

      const vehicle = await Vehicle.findById(booking.vehicle).session(session);
      if (!vehicle) {
        throw new Error("Vehicle not found");
      }

      if (
        vehicle.status !== VEHICLE_STATUS.RESERVED &&
        vehicle.status !== VEHICLE_STATUS.AVAILABLE &&
        vehicle.reservedBy?.toString() !== booking._id.toString()
      ) {
        throw new Error("Vehicle is not available for booking");
      }

      if (vehicle.status === VEHICLE_STATUS.AVAILABLE) {
        const reservedUntil = new Date();
        reservedUntil.setMinutes(reservedUntil.getMinutes() + RESERVATION_HOLD_MINUTES);
        vehicle.status = VEHICLE_STATUS.RESERVED;
        vehicle.reservedBy = booking._id;
        vehicle.reservedUntil = reservedUntil;
        await vehicle.save({ session });
        booking.reservationExpiresAt = reservedUntil;
      } else if (
        vehicle.status === VEHICLE_STATUS.RESERVED &&
        vehicle.reservedBy?.toString() === booking._id.toString()
      ) {
        booking.reservationExpiresAt = vehicle.reservedUntil ?? booking.reservationExpiresAt;
      }

      const now = new Date();
      if (!booking.statusHistory) {
        booking.statusHistory = [];
      }
      if (booking.status === BOOKING_STATUS.PENDING_APPROVAL) {
        booking.statusHistory.push({
          status: BOOKING_STATUS.APPROVED,
          changedAt: now,
          changedBy: null,
          note: "Auto approve for payment",
        });
        booking.approvedAt = now;
        booking.approvedBy = null;
      }

      const waitingAt = booking.status === BOOKING_STATUS.WAITING_PAYMENT ? booking.lastStatusChangedAt ?? now : now;
      booking.statusHistory.push({
        status: BOOKING_STATUS.WAITING_PAYMENT,
        changedAt: waitingAt,
        changedBy: null,
        note: "Waiting for payment",
      });
      booking.markModified?.("statusHistory");

      booking.status = BOOKING_STATUS.WAITING_PAYMENT;
      booking.lastStatusChangedAt = waitingAt;
      if (!booking.paymentDueAt) {
        booking.paymentDueAt = booking.pickupDateTime ?? waitingAt;
      }

      updated = await booking.save({ session });
    });

    return updated;
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};
