import payos from "../config/payos.js";
import Booking from "../models/booking.model.js";
import { confirmBookingOnPending } from "../utils/bookingConfirmation.js";
import PaymentIntent from "../models/paymentIntent.model.js";
import { BOOKING_STATUS } from "../constants/statusCodes.js";

export const createCheckout = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required" });
    }

    // Try to confirm the booking if it's pending
    try {
      await confirmBookingOnPending(bookingId);
    } catch (confirmError) {
      // Handle specific booking confirmation errors
      if (confirmError.message === "Booking not found") {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (confirmError.message === "Booking is not in a confirmable status") {
        return res.status(409).json({
          message: "Booking is not in a confirmable status",
          detail:
            "The booking may already be awaiting payment, cancelled, or completed",
        });
      }
      if (confirmError.message === "No vehicle assigned to booking") {
        return res.status(400).json({
          message: "No vehicle assigned to this booking",
          detail: "A vehicle must be assigned before payment can be processed",
        });
      }
      if (confirmError.message === "Vehicle not found") {
        return res.status(404).json({
          message: "The vehicle assigned to this booking was not found",
          detail: "Please contact support to resolve this issue",
        });
      }
      if (confirmError.message === "Vehicle is not available for booking") {
        return res.status(409).json({
          message: "The assigned vehicle is no longer available",
          detail: "The vehicle may have been rented or is under maintenance",
        });
      }
      // Re-throw unexpected errors
      throw confirmError;
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== BOOKING_STATUS.WAITING_PAYMENT) {
      return res
        .status(409)
        .json({ message: "Booking must be waiting for payment before checkout" });
    }

    const amount = Number(booking.totalPayable);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid booking amount for payment" });
    }

    const orderCode = Number(`${Date.now()}`.slice(-9));

    const paymentLinkResponse = await payos.paymentRequests.create({
      amount,
      orderCode,
      description: `Payment #${orderCode}`,
      returnUrl: `${process.env.FRONTEND_URL}/payos/return?b=${booking._id}`,
      cancelUrl: `${process.env.FRONTEND_URL}/payos/cancel?b=${booking._id}`,
    });

    await PaymentIntent.create({
      orderCode: orderCode.toString(),
      bookingId: booking._id,
      amount,
    });

    return res.status(201).json({
      orderCode: String(orderCode),
      checkoutData: paymentLinkResponse,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("PayOS checkout error:", error);

    // Handle PayOS API errors
    if (error.message?.includes("PayOS")) {
      return res.status(502).json({
        message: "Payment gateway error",
        detail: "Unable to create payment link. Please try again later.",
      });
    }

    // Pass other errors to global error handler
    next(error);
  }
};
