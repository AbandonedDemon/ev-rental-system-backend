import mongoose from "mongoose";
import Booking from "../models/booking.model.js";
import Brand from "../models/brand.model.js";
import Station from "../models/station.model.js";
import Vehicle from "../models/vehicle.model.js";
import User from "../models/user.model.js";
import { manualReleaseReservation } from "../services/reservationService.js";
import {
  BOOKING_STATUS,
  VEHICLE_STATUS,
  RESERVATION_HOLD_MINUTES,
} from "../constants/statusCodes.js";

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
      additionalFees += 500; //TODO: Phụ phí 100k/ngày cuối tuần
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
 * Reserve một vehicle cụ thể cho booking
 * Đổi trạng thái vehicle từ "available" → "reserved"
 */
const reserveVehicle = async (vehicleId, bookingId) => {
  try {
    // Tìm vehicle và check status
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      throw new Error("Vehicle không tồn tại");
    }

    if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
      throw new Error(`Vehicle ${vehicle.plateNo} đang ở trạng thái: ${vehicle.status}`);
    }

    // Tính thời gian reservation (30 phút để user thanh toán)
    const reservedUntil = new Date();
    reservedUntil.setMinutes(reservedUntil.getMinutes() + RESERVATION_HOLD_MINUTES);

    // Update vehicle status to reserved
    vehicle.status = VEHICLE_STATUS.RESERVED;
    vehicle.reservedBy = bookingId;
    vehicle.reservedUntil = reservedUntil;

    await vehicle.save();

    console.log(`🔒 Vehicle reserved: ${vehicle.plateNo} until ${reservedUntil.toISOString()}`);
    return vehicle;

  } catch (error) {
    console.error("❌ Reserve vehicle failed:", error.message);
    return null;
  }
};

/**
 * Tự động tìm và reserve xe available theo brand/station
 */
const autoAssignAndReserveVehicle = async (brandId, stationId, bookingId) => {
  try {
    // Tìm vehicle available cùng brand và station
    const vehicle = await Vehicle.findOne({
      brand: brandId,
      stationId: stationId,
      status: VEHICLE_STATUS.AVAILABLE
    }).sort({
      batteryPercent: -1,  // Ưu tiên xe pin cao
      createdAt: 1         // Hoặc xe cũ nhất (FIFO)
    });

    if (!vehicle) {
      console.log(`⚠️ No available vehicle found for brand ${brandId} at station ${stationId}`);
      return null;
    }

    // Reserve vehicle này
    return await reserveVehicle(vehicle._id, bookingId);

  } catch (error) {
    console.error("❌ Auto assign vehicle failed:", error.message);
    return null;
  }
};

const normalizeObjectId = (value) => {
  if (!value) {
    return null;
  }
  if (mongoose.isValidObjectId(value)) {
    return typeof value === "string" ? new mongoose.Types.ObjectId(value) : value;
  }
  return null;
};

const createStatusEntry = (status, { userId = null, note = null, timestamp = new Date() } = {}) => ({
  status,
  changedAt: timestamp,
  changedBy: normalizeObjectId(userId),
  note,
});

const BOOKING_STATUS_SET = new Set(Object.values(BOOKING_STATUS));
const LEGACY_BOOKING_STATUS_MAP = new Map([
  ["pending", BOOKING_STATUS.PENDING_APPROVAL],
  ["confirmed", BOOKING_STATUS.APPROVED],
  ["paid", BOOKING_STATUS.PAID],
  ["completed", BOOKING_STATUS.SUCCESS],
  ["cancelled", BOOKING_STATUS.CANCELLED],
  ["canceled", BOOKING_STATUS.CANCELLED],
  ["expired", BOOKING_STATUS.PAYMENT_FAILED],
]);

const MANUAL_BOOKING_STATUS_SET = new Set([
  BOOKING_STATUS.APPROVED,
  BOOKING_STATUS.REJECTED,
  BOOKING_STATUS.WAITING_PAYMENT,
  BOOKING_STATUS.PAID,
  BOOKING_STATUS.PAYMENT_FAILED,
  BOOKING_STATUS.CANCELLED,
  BOOKING_STATUS.SUCCESS,
]);

const normalizeBookingStatusValue = (value) => {
  if (!value) {
    return null;
  }
  const str = String(value).trim();
  if (!str) {
    return null;
  }
  const normalized = str.toUpperCase();
  if (BOOKING_STATUS_SET.has(normalized)) {
    return normalized;
  }
  const legacy = str.toLowerCase();
  if (LEGACY_BOOKING_STATUS_MAP.has(legacy)) {
    return LEGACY_BOOKING_STATUS_MAP.get(legacy);
  }
  return null;
};

const transitionBookingStatus = (
  booking,
  status,
  { userId = null, note = null, timestamp = new Date(), paymentDueAt = null, paymentReference = null, reservationExpiresAt = null, rejectionReason = null } = {}
) => {
  if (!booking.statusHistory) {
    booking.statusHistory = [];
  }
  const entry = createStatusEntry(status, { userId, note, timestamp });
  booking.statusHistory.push(entry);
  if (typeof booking.markModified === "function") {
    booking.markModified("statusHistory");
  }

  booking.status = status;
  booking.lastStatusChangedAt = timestamp;

  switch (status) {
    case BOOKING_STATUS.APPROVED:
      booking.approvedAt = timestamp;
      booking.approvedBy = normalizeObjectId(userId) ?? booking.approvedBy ?? null;
      booking.rejectedAt = null;
      booking.rejectedBy = null;
      booking.rejectionReason = null;
      break;
    case BOOKING_STATUS.REJECTED:
      booking.rejectedAt = timestamp;
      booking.rejectedBy = normalizeObjectId(userId);
      if (rejectionReason) {
        booking.rejectionReason = rejectionReason;
      }
      break;
    case BOOKING_STATUS.WAITING_PAYMENT:
      if (paymentDueAt) {
        booking.paymentDueAt = paymentDueAt;
      }
      if (reservationExpiresAt) {
        booking.reservationExpiresAt = reservationExpiresAt;
      }
      break;
    case BOOKING_STATUS.PAID:
      booking.paidAt = timestamp;
      booking.paymentReference = paymentReference ?? booking.paymentReference;
      booking.paymentFailedAt = null;
      break;
    case BOOKING_STATUS.PAYMENT_FAILED:
      booking.paymentFailedAt = timestamp;
      break;
    case BOOKING_STATUS.SUCCESS:
      booking.successAt = timestamp;
      break;
    case BOOKING_STATUS.CANCELLED:
      booking.cancelledAt = timestamp;
      break;
    default:
      break;
  }

  if (reservationExpiresAt && status !== BOOKING_STATUS.WAITING_PAYMENT) {
    booking.reservationExpiresAt = reservationExpiresAt;
  }

  return entry;
};

/**
 * Validate booking data
 */
const validateBookingData = async (data) => {
  const errors = [];

  // Validate customer info (từ form FE)
  if (!data.renterName?.trim()) {
    errors.push("Tên người thuê là bắt buộc");
  }

  if (!data.phoneNumber?.match(/^0[0-9]{9}$/)) {
    errors.push("Số điện thoại không hợp lệ (phải là 10 số bắt đầu bằng 0)");
  }

  if (!data.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push("Email không hợp lệ");
  }

  // Validate booking details
  if (!data.brand) {
    errors.push("Brand ID là bắt buộc");
  }

  if (!data.pickupStation) {
    errors.push("Pickup Station là bắt buộc");
  }

  if (!data.pickupTimeExpected) {
    errors.push("Thời gian nhận xe dự kiến là bắt buộc");
  }

  if (!data.rentalDays || data.rentalDays <= 0) {
    errors.push("Số ngày thuê phải lớn hơn 0");
  }

  // Validate payment method
  const validPaymentMethods = ["online", "cash", "bank_transfer", "credit_card", "e_wallet"];
  if (!data.paymentMethod || !validPaymentMethods.includes(data.paymentMethod)) {
    errors.push(`Phương thức thanh toán không hợp lệ. Chỉ chấp nhận: ${validPaymentMethods.join(", ")}`);
  }

  // Validate agreements
  if (data.agreedToPaymentTerms !== true) {
    errors.push("Phải đồng ý với điều khoản thanh toán");
  }

  if (data.agreedToDataSharing !== true) {
    errors.push("Phải đồng ý chia sẻ dữ liệu cá nhân");
  }

  // Optional validation for vehicle if provided
  if (data.vehicle && !mongoose.Types.ObjectId.isValid(data.vehicle)) {
    errors.push("Vehicle ID không hợp lệ");
  }

  if (data.renter && !mongoose.Types.ObjectId.isValid(data.renter)) {
    errors.push("Renter ID không hợp lệ");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate dates
  const pickupDateTime = new Date(data.pickupTimeExpected);
  const now = new Date();

  if (pickupDateTime < now) {
    errors.push("Thời gian nhận xe không được trong quá khứ");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate brand exists
  const brand = await Brand.findById(data.brand);
  if (!brand) {
    errors.push("Brand không tồn tại");
  } else if (!brand.isActive) {
    errors.push("Brand hiện không khả dụng");
  }

  // Validate station exists (support both ObjectId and code)
  let station;
  if (mongoose.Types.ObjectId.isValid(data.pickupStation) && data.pickupStation.length === 24) {
    // If it's a valid ObjectId format
    station = await Station.findById(data.pickupStation);
  } else {
    // If it's a station code (e.g., "station-hcm-01")
    station = await Station.findOne({ code: data.pickupStation });
  }

  if (!station) {
    errors.push("Station không tồn tại");
  } else if (station.status !== "active") {
    errors.push("Station hiện không hoạt động");
  }

  // Validate vehicle exists if provided
  let vehicle = null;
  if (data.vehicle) {
    vehicle = await Vehicle.findById(data.vehicle);
    if (!vehicle) {
      errors.push("Vehicle không tồn tại");
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    brand,
    station,
    vehicle,
    pickupDateTime,
  };
};

/**
 * POST /api/bookings - Tạo booking mới
 */
export const createBooking = async (req, res, next) => {
  try {
    console.log('📥 Received booking request:', JSON.stringify(req.body, null, 2));

    const {
      // Thông tin khách hàng (từ form FE)
      renterName,
      phoneNumber,
      email,
      // Thông tin booking
      brand,
      pickupStation,
      pickupTimeExpected,
      rentalDays,
      paymentMethod,
      agreedToPaymentTerms,
      agreedToDataSharing,
      // Optional fields
      renter = null,           // ObjectId nếu user đã đăng nhập
      surchargeAmount = 0,
      vehicle = null,
      notes = null,
    } = req.body;

    const resolveObjectIdInput = (value) => {
      if (typeof value !== "string") {
        return null;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const normalizedRenter =
      resolveObjectIdInput(renter) ??
      resolveObjectIdInput(req.body?.renterId) ??
      resolveObjectIdInput(req.body?.userId) ??
      null;

    // Validate
    const validation = await validateBookingData({
      renterName,
      phoneNumber,
      email,
      brand,
      pickupStation,
      pickupTimeExpected,
      rentalDays,
      paymentMethod,
      agreedToPaymentTerms,
      agreedToDataSharing,
      vehicle,
      renter: normalizedRenter,
    });

    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: validation.errors,
      });
    }

    let renterDoc = null;
    if (normalizedRenter) {
      renterDoc = await User.findById(normalizedRenter);
      if (!renterDoc) {
        return res.status(404).json({
          success: false,
          message: "Renter not found",
        });
      }

      if (renterDoc.status !== "verified") {
        return res.status(403).json({
          success: false,
          message: "Tài khoản chưa được xác minh giấy tờ. Không thể đặt xe.",
          detail: "Vui lòng hoàn tất hồ sơ và chờ nhân viên duyệt.",
        });
      }
    }

    const { brand: brandDoc, station, vehicle: vehicleDoc, pickupDateTime } = validation;

    // Tính ngày trả xe dự kiến
    const returnTimeExpected = new Date(pickupDateTime);
    returnTimeExpected.setDate(returnTimeExpected.getDate() + rentalDays);

    // Tính giá chi tiết sử dụng logic có sẵn
    const pricing = calculatePricing(brandDoc, rentalDays, pickupDateTime, returnTimeExpected);

    // Map pricing sang format mới
    const baseAmount = pricing.basePrice;
    const depositAmount = pricing.depositAmount;
    const additionalFees = pricing.additionalFees; // Phụ phí cuối tuần
    const totalAmount = pricing.totalPayable + surchargeAmount; // Tổng + phụ phí thêm

    const createdAt = new Date();
    const statusHistory = [
      createStatusEntry(BOOKING_STATUS.CREATED, {
        userId: renterDoc ? renterDoc._id : null,
        note: "Booking created",
        timestamp: createdAt,
      }),
      createStatusEntry(BOOKING_STATUS.PENDING_APPROVAL, {
        note: "Chờ duyệt",
        timestamp: createdAt,
      }),
    ];

    // Tạo booking với format phù hợp model hiện tại
    const booking = await Booking.create({
      // Thông tin người thuê
      renter: renterDoc ? renterDoc._id : null,
      renterName: renterName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.toLowerCase().trim(),

      // Thông tin booking
      brand: brandDoc._id,
      pickupStation: station._id,
      vehicle: vehicleDoc?._id || null,

      // Thời gian - map từ pickupTimeExpected sang format model
      pickupDate: new Date(pickupDateTime.toDateString()), // Chỉ lấy date part
      pickupTime: pickupDateTime.toTimeString().slice(0, 5), // HH:mm format
      returnDate: new Date(returnTimeExpected.toDateString()), // Chỉ lấy date part
      returnTime: returnTimeExpected.toTimeString().slice(0, 5), // HH:mm format
      pickupDateTime: pickupDateTime, // Full datetime
      returnDateTime: returnTimeExpected, // Full datetime

      rentalDays,

      // Giá cả - theo format model hiện tại
      basePrice: baseAmount,
      additionalFees: additionalFees,
      totalRentalFee: baseAmount + additionalFees,
      depositAmount: depositAmount,
      totalPayable: totalAmount,

      // Thông tin khác
      paymentMethod,
      notes,
      agreedToPaymentTerms,
      agreedToDataSharing,
      status: BOOKING_STATUS.PENDING_APPROVAL,
      statusHistory,
      lastStatusChangedAt: statusHistory[statusHistory.length - 1].changedAt,
      paymentDueAt: null,
      reservationExpiresAt: null,
    });

    // 🚗 AUTO-RESERVE VEHICLE: Giữ xe trong quá trình thanh toán (giống ghế rạp)
    let reservedVehicle = null;
    if (vehicleDoc) {
      // Nếu user đã chọn xe cụ thể, reserve ngay lập tức
      reservedVehicle = await reserveVehicle(vehicleDoc._id, booking._id);
    } else {
      // Nếu chưa chọn xe, tự động tìm và reserve xe available cùng brand/station
      reservedVehicle = await autoAssignAndReserveVehicle(brandDoc._id, station._id, booking._id);
    }

    if (reservedVehicle) {
      // Update booking với vehicle đã reserve
      booking.vehicle = reservedVehicle._id;
      await booking.save();

      console.log(`✅ Vehicle reserved: ${reservedVehicle.plateNo} (${reservedVehicle._id}) for booking ${booking.bookingCode}`);
    } else {
      console.log(`⚠️ No vehicle available to reserve for booking ${booking.bookingCode}`);
    }

    // Populate để trả về đầy đủ thông tin
    const populatedBooking = await Booking.findById(booking._id)
      .populate("renter", "fullName email phoneNumber")
      .populate("brand", "name code baseDailyRate depositAmount")
      .populate("pickupStation", "name code address")
      .populate("vehicle", "vin plateNo model batteryPercent status");

    res.status(201).json({
      success: true,
      message: reservedVehicle ? "Tạo booking và reserve xe thành công" : "Tạo booking thành công (chưa có xe available)",
      data: {
        _id: populatedBooking._id,
        bookingCode: populatedBooking.bookingCode,
        renterName: populatedBooking.renterName,
        phoneNumber: populatedBooking.phoneNumber,
        email: populatedBooking.email,
        brand: populatedBooking.brand,
        pickupStation: populatedBooking.pickupStation,
        vehicle: populatedBooking.vehicle,
        pickupTimeExpected: populatedBooking.pickupTimeExpected,
        returnTimeExpected: populatedBooking.returnTimeExpected,
        rentalDays: populatedBooking.rentalDays,
        pricing: {
          basePrice: populatedBooking.basePrice,
          additionalFees: populatedBooking.additionalFees,
          totalRentalFee: populatedBooking.totalRentalFee,
          depositAmount: populatedBooking.depositAmount,
          totalPayable: populatedBooking.totalPayable,
        },
        paymentMethod: populatedBooking.paymentMethod,
        status: populatedBooking.status,
        notes: populatedBooking.notes,
        createdAt: populatedBooking.createdAt,
        // 🚗 Thông tin reservation
        reservation: reservedVehicle ? {
          vehicleReserved: true,
          reservedUntil: reservedVehicle.reservedUntil,
          paymentTimeLimit: "30 phút",
          message: `Xe ${reservedVehicle.plateNo} đã được giữ cho bạn. Vui lòng thanh toán trong 30 phút.`
        } : {
          vehicleReserved: false,
          message: "Hiện không có xe available. Chúng tôi sẽ gán xe khi có xe trống."
        }
      },
    });
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

    const resolveQueryObjectId = (...values) => {
      for (const value of values) {
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (trimmed) {
            return trimmed;
          }
        }
      }
      return null;
    };

    const renterQuery = resolveQueryObjectId(
      req.query.renterId,
      req.query.renter,
      req.query.userId,
      req.query.renter_id,
      req.query.user_id
    );

    if (renterQuery) {
      if (!mongoose.Types.ObjectId.isValid(renterQuery)) {
        return res.status(400).json({
          success: false,
          message: "renterId không hợp lệ (phải là ObjectId 24 ký tự).",
        });
      }
      filter.renter = new mongoose.Types.ObjectId(renterQuery);
    }

    if (req.query.status) {
      const normalizedStatus = normalizeBookingStatusValue(req.query.status);
      if (!normalizedStatus) {
        return res.status(400).json({
          success: false,
          message: `status không hợp lệ. Giá trị hợp lệ: ${Array.from(BOOKING_STATUS_SET).join(", ")}`,
        });
      }
      filter.status = normalizedStatus;
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

    if ([BOOKING_STATUS.SUCCESS, BOOKING_STATUS.CANCELLED].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy booking đã ${booking.status === BOOKING_STATUS.SUCCESS ? "hoàn thành" : "hủy"}`,
      });
    }

    // 🔓 Release reservation nếu có xe đang được reserve
    const releaseResult = await manualReleaseReservation(booking._id);
    if (releaseResult) {
      console.log(`🔓 Released reservation for cancelled booking ${booking.bookingCode}`);
    }

    const now = new Date();
    booking.statusHistory = booking.statusHistory ?? [];
    booking.statusHistory.push(
      createStatusEntry(BOOKING_STATUS.CANCELLED, {
        timestamp: now,
        userId: req.user?._id ?? null,
        note: "Booking cancelled by user",
      }),
    );
    booking.markModified?.("statusHistory");
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancelledAt = now;
    booking.lastStatusChangedAt = now;
    await booking.save();

    res.json({
      success: true,
      message: "Hủy booking thành công" + (releaseResult ? " và đã trả xe về available" : ""),
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/bookings/:id/status - Cập nhật trạng thái booking (Staff/Admin only)
 *
 * Flow trạng thái (phiên bản BA):
 * 1. CREATED → PENDING_APPROVAL (khách gửi yêu cầu)
 * 2. APPROVED (staff) → WAITING_PAYMENT (hệ thống chuyển chờ thanh toán)
 * 3. PAID (cổng thanh toán hoặc thu ngân) → SUCCESS (khi tạo rental)
 * 4. PAYMENT_FAILED / CANCELLED (BGJ hoặc staff) xử lý timeout & huỷ
 */
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status: requestedStatus,
      vehicleId,
      note = null,
      paymentDueAt = null,
      rejectionReason = null,
      paymentReference = null,
    } = req.body ?? {};

    const normalizedStatus = normalizeBookingStatusValue(requestedStatus);
    if (!normalizedStatus || !MANUAL_BOOKING_STATUS_SET.has(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${Array.from(MANUAL_BOOKING_STATUS_SET).join(", ")}`,
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    const currentStatus = booking.status;
    const actorId = req.user?._id ?? null;

    const ensureVehicleAssignment = async () => {
      if (vehicleId) {
        if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
          throw new Error("Vehicle ID không hợp lệ");
        }

        if (booking.vehicle && booking.vehicle.toString() !== vehicleId.toString()) {
          await manualReleaseReservation(booking._id);
        }

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
          throw new Error("Không tìm thấy xe");
        }
        if (
          vehicle.status !== VEHICLE_STATUS.AVAILABLE &&
          !(vehicle.status === VEHICLE_STATUS.RESERVED && vehicle.reservedBy?.toString() === booking._id.toString())
        ) {
          throw new Error(`Xe hiện đang ở trạng thái: ${vehicle.status}, không thể gán cho booking`);
        }
        if (vehicle.brand.toString() !== booking.brand.toString()) {
          throw new Error("Xe không thuộc brand đã đặt");
        }
        if (vehicle.stationId?.toString() !== booking.pickupStation.toString()) {
          throw new Error("Xe không ở station đã chọn");
        }

        let reservedVehicle = vehicle;
        if (vehicle.status === VEHICLE_STATUS.AVAILABLE) {
          reservedVehicle = await reserveVehicle(vehicle._id, booking._id);
          if (!reservedVehicle) {
            throw new Error("Không thể reserve xe cho booking");
          }
        }

        booking.vehicle = reservedVehicle._id;
        booking.reservationExpiresAt = reservedVehicle.reservedUntil ?? booking.reservationExpiresAt;
        return reservedVehicle;
      }

      if (!booking.vehicle) {
        throw new Error("Phải gán xe (vehicleId) khi phê duyệt booking");
      }

      const vehicle = await Vehicle.findById(booking.vehicle);
      if (!vehicle) {
        throw new Error("Xe đã được gỡ khỏi hệ thống, cần gán xe mới");
      }
      if (
        vehicle.status === VEHICLE_STATUS.AVAILABLE ||
        (vehicle.status === VEHICLE_STATUS.RESERVED && vehicle.reservedBy?.toString() === booking._id.toString())
      ) {
        if (vehicle.status === VEHICLE_STATUS.AVAILABLE) {
          const reserved = await reserveVehicle(vehicle._id, booking._id);
          if (reserved) {
            booking.reservationExpiresAt = reserved.reservedUntil;
          }
        } else {
          booking.reservationExpiresAt = vehicle.reservedUntil ?? booking.reservationExpiresAt;
        }
        return vehicle;
      }

      throw new Error("Xe đã được sử dụng cho booking khác, cần gán xe khác");
    };

    const markWaitingPayment = (options = {}) =>
      transitionBookingStatus(booking, BOOKING_STATUS.WAITING_PAYMENT, {
        userId: actorId,
        note: options.note ?? "Chờ thanh toán",
        paymentDueAt:
          options.paymentDueAt ??
          (booking.paymentDueAt
            ? new Date(booking.paymentDueAt)
            : booking.pickupDateTime
            ? new Date(booking.pickupDateTime)
            : null),
        reservationExpiresAt: booking.reservationExpiresAt,
      });

    try {
      switch (normalizedStatus) {
        case BOOKING_STATUS.APPROVED: {
          if (currentStatus !== BOOKING_STATUS.PENDING_APPROVAL) {
            return res.status(400).json({
              success: false,
              message: `Chỉ có thể phê duyệt booking ở trạng thái ${BOOKING_STATUS.PENDING_APPROVAL}`,
            });
          }

          await ensureVehicleAssignment();
          transitionBookingStatus(booking, BOOKING_STATUS.APPROVED, {
            userId: actorId,
            note,
            reservationExpiresAt: booking.reservationExpiresAt,
          });
          markWaitingPayment({ paymentDueAt: paymentDueAt ? new Date(paymentDueAt) : null });
          break;
        }

        case BOOKING_STATUS.REJECTED: {
          if (currentStatus !== BOOKING_STATUS.PENDING_APPROVAL) {
            return res.status(400).json({
              success: false,
              message: `Chỉ có thể từ chối booking ở trạng thái ${BOOKING_STATUS.PENDING_APPROVAL}`,
            });
          }

          await manualReleaseReservation(booking._id);
          transitionBookingStatus(booking, BOOKING_STATUS.REJECTED, {
            userId: actorId,
            note,
            rejectionReason,
          });
          transitionBookingStatus(booking, BOOKING_STATUS.CANCELLED, {
            userId: actorId,
            note: "Booking bị từ chối",
          });
          break;
        }

        case BOOKING_STATUS.WAITING_PAYMENT: {
          if (![BOOKING_STATUS.APPROVED, BOOKING_STATUS.WAITING_PAYMENT].includes(currentStatus)) {
            return res.status(400).json({
              success: false,
              message: `Chỉ chuyển sang trạng thái ${BOOKING_STATUS.WAITING_PAYMENT} khi booking đã được phê duyệt`,
            });
          }
          markWaitingPayment({ note, paymentDueAt: paymentDueAt ? new Date(paymentDueAt) : null });
          break;
        }

        case BOOKING_STATUS.PAID: {
          if (![BOOKING_STATUS.WAITING_PAYMENT, BOOKING_STATUS.APPROVED].includes(currentStatus)) {
            return res.status(400).json({
              success: false,
              message: `Chỉ có thể đánh dấu ${BOOKING_STATUS.PAID} khi booking đang chờ thanh toán`,
            });
          }
          transitionBookingStatus(booking, BOOKING_STATUS.PAID, {
            userId: actorId,
            note,
            paymentReference,
          });
          if (booking.vehicle) {
            const vehicle = await Vehicle.findById(booking.vehicle);
            if (vehicle) {
              vehicle.status = VEHICLE_STATUS.RENTED;
              vehicle.reservedBy = booking._id;
              vehicle.reservedUntil = null;
              await vehicle.save();
            }
          }
          break;
        }

        case BOOKING_STATUS.PAYMENT_FAILED: {
          if (currentStatus !== BOOKING_STATUS.WAITING_PAYMENT) {
            return res.status(400).json({
              success: false,
              message: `Chỉ có thể đánh dấu ${BOOKING_STATUS.PAYMENT_FAILED} khi booking đang chờ thanh toán`,
            });
          }
          transitionBookingStatus(booking, BOOKING_STATUS.PAYMENT_FAILED, {
            userId: actorId,
            note,
          });
          break;
        }

        case BOOKING_STATUS.CANCELLED: {
          await manualReleaseReservation(booking._id);
          transitionBookingStatus(booking, BOOKING_STATUS.CANCELLED, {
            userId: actorId,
            note,
          });
          break;
        }

        case BOOKING_STATUS.SUCCESS: {
          if (currentStatus !== BOOKING_STATUS.PAID) {
            return res.status(400).json({
              success: false,
              message: `Chỉ có thể đánh dấu ${BOOKING_STATUS.SUCCESS} khi booking đã thanh toán`,
            });
          }
          transitionBookingStatus(booking, BOOKING_STATUS.SUCCESS, {
            userId: actorId,
            note,
          });
          break;
        }

        default:
          break;
      }
    } catch (transitionError) {
      return res.status(400).json({
        success: false,
        message: transitionError.message || "Không thể cập nhật trạng thái booking",
      });
    }

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate("brand", "name code baseDailyRate")
      .populate("pickupStation", "name code address")
      .populate("vehicle", "vin plateNo model status");

    res.json({
      success: true,
      message: `Cập nhật trạng thái booking thành công: ${currentStatus} → ${normalizedStatus}`,
      data: updatedBooking,
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
  updateBookingStatus,
};
