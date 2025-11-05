import Payment from "../models/payment.model.js";
import { PAYMENT_STATUS } from "../constants/statusCodes.js";

const DEFAULT_PAYMENTS = [
  {
    bookingKey: "alice-early-june",
    rentalKey: "alice-june-trip",
    method: "card",
    status: PAYMENT_STATUS.SUCCESS,
    surchargeAmount: 50000,
    txnRef: "EVPAY-20240601-0001",
  },
  {
    bookingKey: "alice-august-getaway",
    rentalKey: "alice-august-ongoing",
    method: "card",
    status: PAYMENT_STATUS.SUCCESS,
    surchargeAmount: 0,
    txnRef: null,
  },
  {
    bookingKey: "minh-danang-weekend",
    rentalKey: "minh-danang-trip",
    method: "wallet",
    status: PAYMENT_STATUS.SUCCESS,
    surchargeAmount: 30000,
    txnRef: "EVPAY-20240817-0003",
  },
];

const computeAmountsFromBooking = (booking, overrideSurcharge) => {
  const baseAmount = Number(booking.baseAmount ?? 0);
  const depositAmount = Number(booking.depositAmount ?? 0);
  const surchargeAmount =
    overrideSurcharge ?? Number(booking.surchargeAmount ?? 0);

  return {
    baseAmount,
    depositAmount,
    surchargeAmount,
    totalAmount: baseAmount + depositAmount + surchargeAmount,
  };
};

export const seedPayments = async ({ bookingMap, rentalMap }) => {
  for (const payment of DEFAULT_PAYMENTS) {
    const booking = bookingMap.get(payment.bookingKey);
    if (!booking) {
      continue;
    }

    const rentalDoc = payment.rentalKey
      ? rentalMap?.get(payment.rentalKey) ?? null
      : null;

    const amounts = computeAmountsFromBooking(booking, payment.surchargeAmount);

    let doc = await Payment.findOneAndUpdate(
      {
        booking: booking._id,
        method: payment.method,
      },
      {
        booking: booking._id,
        rental: rentalDoc?._id ?? null,
        method: payment.method,
        status: payment.status,
        baseAmount: amounts.baseAmount,
        depositAmount: amounts.depositAmount,
        surchargeAmount: amounts.surchargeAmount,
        totalAmount: amounts.totalAmount,
        txnRef: payment.txnRef ?? null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    doc = await doc.populate([
      { path: "booking", select: "_id" },
      { path: "rental", select: "_id" },
    ]);
  }

  const count = await Payment.estimatedDocumentCount();
  console.log(`Payment seed complete. Total payments: ${count}`);
};

export default seedPayments;
