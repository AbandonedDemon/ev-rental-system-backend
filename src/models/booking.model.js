import mongoose from "mongoose";
import { BOOKING_STATUS } from "../constants/statusCodes.js";

const bookingSchema = new mongoose.Schema(
  {
    // Thông tin người thuê
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Có thể null cho khách vãng lai
    },
    renterName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      match: /^0[0-9]{9}$/, // Format: 09xxxxxxxx (10 số bắt đầu bằng 0)
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Email format
    },

    // Thông tin thuê xe
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    pickupStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null, // Sẽ được gán sau khi confirm
    },

    // Thời gian thuê
    pickupDate: {
      type: Date,
      required: true,
    },
    pickupTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, // Format HH:mm
    },
    returnDate: {
      type: Date,
      required: true,
    },
    returnTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, // Format HH:mm
    },
    pickupDateTime: {
      type: Date,
      required: true,
    },
    returnDateTime: {
      type: Date,
      required: true,
    },
    rentalDays: {
      type: Number,
      min: 1,
      required: true,
    },

    // Giá cả
    basePrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    additionalFees: {
      type: Number,
      min: 0,
      default: 0, // Phụ phí cuối tuần, v.v.
    },
    totalRentalFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    depositAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalPayable: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Thông tin bổ sung
    pickupLocation: {
      type: String,
      trim: true,
      default: null, // Địa chỉ cụ thể nhận xe
    },
    promoCode: {
      type: String,
      trim: true,
      default: null, // Mã giới thiệu
    },
    notes: {
      type: String,
      trim: true,
      default: null, // Ghi chú
    },

    // Thanh toán
    paymentMethod: {
      type: String,
      enum: ["online", "cash", "bank_transfer", "credit_card", "e_wallet"],
      required: true,
    },
    paymentReference: {
      type: String,
      trim: true,
      default: null,
    },
    paymentDueAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentFailedAt: {
      type: Date,
      default: null,
    },
    reservationExpiresAt: {
      type: Date,
      default: null,
    },
    successAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    expiredAt: {
      type: Date,
      default: null,
    },

    // Đồng ý điều khoản
    agreedToPaymentTerms: {
      type: Boolean,
      required: true,
      validate: {
        validator: (v) => v === true,
        message: "Phải đồng ý với điều khoản thanh toán",
      },
    },
    agreedToDataSharing: {
      type: Boolean,
      required: true,
      validate: {
        validator: (v) => v === true,
        message: "Phải đồng ý chia sẻ dữ liệu cá nhân",
      },
    },

    // Trạng thái
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.CREATED,
    },
    lastStatusChangedAt: {
      type: Date,
      default: null,
    },
    statusHistory: {
      type: [
        {
          status: {
            type: String,
            enum: Object.values(BOOKING_STATUS),
          },
          changedAt: {
            type: Date,
            default: Date.now,
          },
          changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          note: {
            type: String,
            trim: true,
            default: null,
          },
        },
      ],
      default: undefined,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },

    // Mã booking tự động
    bookingCode: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Generate booking code trước khi save
bookingSchema.pre("save", async function (next) {
  if (!this.lastStatusChangedAt) {
    this.lastStatusChangedAt = new Date();
  }
  if (!this.bookingCode) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await mongoose.model("Booking").countDocuments({
      createdAt: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999)),
      },
    });
    this.bookingCode = `BK${dateStr}${String(count + 1).padStart(3, "0")}`;
  }
  next();
});

export const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
