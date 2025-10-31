import mongoose from "mongoose";
import Booking from "../models/booking.model.js";
import Brand from "../models/brand.model.js";
import Station from "../models/station.model.js";
import Vehicle from "../models/vehicle.model.js";

/**
 * Tính số ngày thuê
 */
const calculateRentalDays = (pickupDateTime, returnDateTime) => {
  const diff = returnDateTime - pickupDateTime;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(days, 1); // Tối thiểu 1 ngày
};

/**
 * Tính giá
 */
const calculatePricing = (brand, rentalDays, pickupDateTime, returnDateTime) => {
  const basePrice = brand.baseDailyRate * rentalDays;

  // Tính phụ phí cuối tuần
  let additionalFees = 0;
  const current = new Date(pickupDateTime);
  while (current < returnDateTime) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
      additionalFees += 100000; // Phụ phí 100k/ngày cuối tuần
    }
    current.setDate(current.getDate() + 1);
  }

  const totalRentalFee = basePrice + additionalFees;
  const depositAmount = brand.depositAmount;
  const totalPayable = totalRentalFee + depositAmount;

  return {
    basePrice,
    additionalFees,
    totalRentalFee,
    depositAmount,
    totalPayable,
  };
};

/**
 * Parse datetime từ date và time string
 */
const parseDateTime = (dateStr, timeStr) => {
  const date = new Date(dateStr);
  const [hours, minutes] = timeStr.split(":");
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
};

/**
 * Validate booking data
 */
const validateBookingData = async (data) => {
  const errors = [];

  // Validate required fields
  if (!data.renterName?.trim()) {
    errors.push("Tên người thuê là bắt buộc");
  }

  if (!data.phoneNumber?.match(/^0[0-9]{9}$/)) {
    errors.push("Số điện thoại không hợp lệ (phải là 10 số bắt đầu bằng 0)");
  }

  if (!data.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push("Email không hợp lệ");
  }

  if (!data.brandId) {
    errors.push("Brand ID là bắt buộc");
  }

  if (!data.stationId) {
    errors.push("Station ID là bắt buộc");
  }

  if (!data.pickupDate) {
    errors.push("Ngày nhận xe là bắt buộc");
  }

  if (!data.pickupTime?.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)) {
    errors.push("Giờ nhận xe không hợp lệ (phải là HH:mm)");
  }

  if (!data.returnDate) {
    errors.push("Ngày trả xe là bắt buộc");
  }

  if (!data.returnTime?.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)) {
    errors.push("Giờ trả xe không hợp lệ (phải là HH:mm)");
  }

  if (!data.paymentMethod) {
    errors.push("Phương thức thanh toán là bắt buộc");
  }

  if (data.agreedToPaymentTerms !== true) {
    errors.push("Phải đồng ý với điều khoản thanh toán");
  }

  if (data.agreedToDataSharing !== true) {
    errors.push("Phải đồng ý chia sẻ dữ liệu cá nhân");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate dates
  const pickupDateTime = parseDateTime(data.pickupDate, data.pickupTime);
  const returnDateTime = parseDateTime(data.returnDate, data.returnTime);
  const now = new Date();

  if (pickupDateTime < now) {
    errors.push("Ngày nhận xe không được trong quá khứ");
  }

  if (returnDateTime <= pickupDateTime) {
    errors.push("Ngày trả xe phải sau ngày nhận xe");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate brand exists
  const brand = await Brand.findById(data.brandId);
  if (!brand) {
    errors.push("Brand không tồn tại");
  } else if (!brand.isActive) {
    errors.push("Brand hiện không khả dụng");
  }

  // Validate station exists (support both ObjectId and code)
  let station;
  if (mongoose.Types.ObjectId.isValid(data.stationId) && data.stationId.length === 24) {
    // If it's a valid ObjectId format
    station = await Station.findById(data.stationId);
  } else {
    // If it's a station code (e.g., "station-hcm-01")
    station = await Station.findOne({ code: data.stationId });
  }

  if (!station) {
    errors.push("Station không tồn tại");
  } else if (station.status !== "active") {
    errors.push("Station hiện không hoạt động");
  }    // Validate payment method
  const validPaymentMethods = ["online", "cash", "bank_transfer", "credit_card", "e_wallet"];
  if (!validPaymentMethods.includes(data.paymentMethod)) {
    errors.push(`Phương thức thanh toán không hợp lệ. Chỉ chấp nhận: ${validPaymentMethods.join(", ")}`);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    brand,
    station,
    pickupDateTime,
    returnDateTime,
  };
};

/**
 * POST /api/bookings - Tạo booking mới
 */
export const createBooking = async (req, res, next) => {
  try {
    console.log('📥 Received booking request:', JSON.stringify(req.body, null, 2));

    const {
      renterName,
      phoneNumber,
      email,
      brandId,
      stationId,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      paymentMethod,
      agreedToPaymentTerms,
      agreedToDataSharing,
      pickupLocation, // Địa chỉ cụ thể nhận xe (optional)
      promoCode, // Mã giới thiệu (optional)
      notes, // Ghi chú (optional)
    } = req.body;

    // Validate
    const validation = await validateBookingData({
      renterName,
      phoneNumber,
      email,
      brandId,
      stationId,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      paymentMethod,
      agreedToPaymentTerms,
      agreedToDataSharing,
    });

    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: validation.errors,
      });
    }

    const { brand, station, pickupDateTime, returnDateTime } = validation;

    // Tính số ngày và giá
    const rentalDays = calculateRentalDays(pickupDateTime, returnDateTime);
    const pricing = calculatePricing(brand, rentalDays, pickupDateTime, returnDateTime);

    // Tạo booking
    const booking = await Booking.create({
      renterName,
      phoneNumber,
      email,
      brand: brand._id,
      pickupStation: station._id,
      pickupDate: new Date(pickupDate),
      pickupTime,
      returnDate: new Date(returnDate),
      returnTime,
      pickupDateTime,
      returnDateTime,
      rentalDays,
      basePrice: pricing.basePrice,
      additionalFees: pricing.additionalFees,
      totalRentalFee: pricing.totalRentalFee,
      depositAmount: pricing.depositAmount,
      totalPayable: pricing.totalPayable,
      paymentMethod,
      agreedToPaymentTerms,
      agreedToDataSharing,
      pickupLocation: pickupLocation || null,
      promoCode: promoCode || null,
      notes: notes || null,
      status: "pending_payment",
    });

    // Populate để trả về đầy đủ thông tin
    const populatedBooking = await Booking.findById(booking._id)
      .populate("brand", "name code baseDailyRate depositAmount")
      .populate("pickupStation", "name code address");

    // Format response
    const response = {
      success: true,
      message: "Đặt xe thành công",
      data: {
        _id: populatedBooking._id,
        bookingCode: populatedBooking.bookingCode,
        renterName: populatedBooking.renterName,
        phoneNumber: populatedBooking.phoneNumber,
        email: populatedBooking.email,
        brand: {
          _id: populatedBooking.brand._id,
          name: populatedBooking.brand.name,
          code: populatedBooking.brand.code,
        },
        station: {
          _id: populatedBooking.pickupStation._id,
          name: populatedBooking.pickupStation.name,
          code: populatedBooking.pickupStation.code,
        },
        pickupDateTime: populatedBooking.pickupDateTime,
        returnDateTime: populatedBooking.returnDateTime,
        rentalDays: populatedBooking.rentalDays,
        pricing: {
          basePrice: populatedBooking.basePrice,
          additionalFees: populatedBooking.additionalFees,
          totalRentalFee: populatedBooking.totalRentalFee,
          depositAmount: populatedBooking.depositAmount,
          totalPayable: populatedBooking.totalPayable,
        },
        paymentMethod: populatedBooking.paymentMethod,
        pickupLocation: populatedBooking.pickupLocation,
        promoCode: populatedBooking.promoCode,
        notes: populatedBooking.notes,
        status: populatedBooking.status,
        createdAt: populatedBooking.createdAt,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('❌ Booking creation error:', error);
    console.error('Error stack:', error.stack);

    // Xử lý validation errors từ Mongoose
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      console.log('Mongoose validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors,
      });
    }

    next(error);
  }
};

/**
 * GET /api/bookings - Lấy danh sách bookings
 */
export const listBookings = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.email) {
      filter.email = req.query.email.toLowerCase();
    }
    if (req.query.phoneNumber) {
      filter.phoneNumber = req.query.phoneNumber;
    }
    if (req.query.bookingCode) {
      filter.bookingCode = req.query.bookingCode;
    }

    const bookings = await Booking.find(filter)
      .populate("brand", "name code baseDailyRate")
      .populate("pickupStation", "name code address")
      .populate("vehicle", "vin plateNo model")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id - Lấy chi tiết booking
 */
export const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("brand", "name code baseDailyRate depositAmount imageUrl specs")
      .populate("pickupStation", "name code address coordinates")
      .populate("vehicle", "vin plateNo model batteryPercent status");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/bookings/:id/cancel - Hủy booking
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    if (booking.status === "completed" || booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy booking đã ${booking.status === "completed" ? "hoàn thành" : "hủy"}`,
      });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({
      success: true,
      message: "Hủy booking thành công",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createBooking,
  listBookings,
  getBooking,
  cancelBooking,
};
