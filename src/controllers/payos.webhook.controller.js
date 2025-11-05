import crypto from "crypto";
import mongoose from "mongoose";
import PaymentIntent from "../models/paymentIntent.model.js";
import Booking from "../models/booking.model.js";
import { createPayment as createPaymentController } from "../controllers/payment.controller.js";
import { updateBookingStatus as updateBookingStatusController } from "../controllers/booking.controller.js"; // we’ll reuse it
import { BOOKING_STATUS, PAYMENT_STATUS } from "../constants/statusCodes.js";

const verifySig = (data, signature) => {
  const key = process.env.PAYOS_CHECKSUM_KEY;
  const s = Object.keys(data)
    .sort()
    .map((k) => `${k}=${encodeURI(data[k] ?? "")}`)
    .join("&");
  const h = crypto.createHmac("sha256", key).update(s).digest("hex");
  return h === signature;
};

export const webhook = async (req, res) => {
  try {
    const { data, signature } = req.body || {};
    if (!data || !signature || !verifySig(data, signature))
      return res.sendStatus(401);

    const orderCode = String(data.orderCode);
    const intent = await PaymentIntent.findOne({ orderCode });
    if (!intent) return res.sendStatus(200);

    const existingPaid = await mongoose.connection
      .collection("payments")
      .findOne({ txnRef: orderCode, status: PAYMENT_STATUS.SUCCESS });
    if (existingPaid) return res.sendStatus(200);

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const booking = await Booking.findById(intent.bookingId).session(
          session,
        );
        if (!booking) throw new Error("Booking not found");
        if (booking.status !== BOOKING_STATUS.WAITING_PAYMENT) {
          // be strict: your flow requires confirmed → paid
          throw new Error(`Unexpected booking status: ${booking.status}`);
        }

        const fauxReq = {
          body: {
            booking: booking._id.toString(),
            method: "transfer",
            status: PAYMENT_STATUS.SUCCESS,
            txnRef: orderCode,
            skipBookingUpdate: true,
          },
        };
        await new Promise((resolve, reject) => {
          const fauxRes = { status: () => fauxRes, json: () => resolve() };
          createPaymentController(fauxReq, fauxRes, reject);
        });

        const fauxReq2 = {
          params: { id: booking._id.toString() },
          body: { status: BOOKING_STATUS.PAID },
        };
        await new Promise((resolve, reject) => {
          const fauxRes2 = { json: () => resolve(), status: () => fauxRes2 };
          updateBookingStatusController(fauxReq2, fauxRes2, reject);
        });

        intent.status = "captured";
        await intent.save({ session });
      });
    } finally {
      session.endSession();
    }

    return res.sendStatus(200);
  } catch (e) {
    console.error("PayOS webhook error", e);
    return res.sendStatus(200);
  }
};
