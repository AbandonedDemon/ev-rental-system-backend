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
      status = "pending",
      surchargeAmount = 0,
      vehicle = null,
      notes = null,
    } = req.body;

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
    });

    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: validation.errors,
      });
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

    // Tạo booking với format phù hợp model hiện tại
    const booking = await Booking.create({
      // Thông tin người thuê
      renter: renter || null,
      renterName: renterName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.toLowerCase().trim(),

      // Thông tin booking
      brand: brandDoc._id,
      pickupStation: station._id,
      vehicle: vehicleDoc?._id || null,

      // Thời gian - map từ pickupTimeExpected sang format model
      pickupDate: new Date(pickupDateTime.toDateString()),  // Chỉ lấy date part
      pickupTime: pickupDateTime.toTimeString().slice(0, 5), // HH:mm format
      returnDate: new Date(returnTimeExpected.toDateString()), // Chỉ lấy date part
      returnTime: returnTimeExpected.toTimeString().slice(0, 5), // HH:mm format
      pickupDateTime: pickupDateTime,     // Full datetime
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
      status,
    });

    // Populate để trả về đầy đủ thông tin
    const populatedBooking = await Booking.findById(booking._id)
      .populate("renter", "fullName email phoneNumber")
      .populate("brand", "name code baseDailyRate depositAmount")
      .populate("pickupStation", "name code address")
      .populate("vehicle", "vin plateNo model batteryPercent status");

    res.status(201).json({
      success: true,
      message: "Tạo booking thành công",
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

/**
 * PUT /api/bookings/:id/status - Cập nhật trạng thái booking (Staff/Admin only)
 * 
 * Flow trạng thái:
 * 1. pending → User tạo booking chọn Brand (chưa có xe cụ thể)
 * 2. confirmed → Staff xác nhận và GÁN XE cụ thể cho booking
 * 3. paid → User thấy xe đã gán, thanh toán thành công (tạo Rental)
 * 4. completed → Hoàn thành thuê xe, trả xe
 * 5. cancelled → Hủy booking (trả xe nếu đã gán)
 * 6. expired → Hết hạn (quá pickupDateTime mà vẫn pending)
 */
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, vehicleId } = req.body;

    // Validate status
    const validStatuses = ["pending", "confirmed", "paid", "completed", "cancelled", "expired"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}`,
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    // Business rules cho việc chuyển trạng thái
    const currentStatus = booking.status;

    // Không cho phép update booking đã completed
    if (currentStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "Không thể thay đổi trạng thái booking đã hoàn thành",
      });
    }

    // CONFIRMED: Staff xác nhận booking và GÁN XE
    // Phải gán vehicle khi confirm
    if (status === "confirmed") {
      // Chỉ cho phép confirm từ pending
      if (currentStatus !== "pending") {
        return res.status(400).json({
          success: false,
          message: `Chỉ có thể xác nhận booking ở trạng thái pending. Trạng thái hiện tại: ${currentStatus}`,
        });
      }

      if (!vehicleId) {
        return res.status(400).json({
          success: false,
          message: "Phải gán xe (vehicleId) khi xác nhận booking",
        });
      }

      // Kiểm tra vehicle tồn tại và available
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy xe",
        });
      }

      if (vehicle.status !== "available") {
        return res.status(400).json({
          success: false,
          message: `Xe hiện đang ở trạng thái: ${vehicle.status}, không thể gán cho booking`,
        });
      }

      // Kiểm tra xe có đúng brand không
      if (vehicle.brand.toString() !== booking.brand.toString()) {
        return res.status(400).json({
          success: false,
          message: "Xe không thuộc brand đã đặt",
        });
      }

      // Kiểm tra xe có ở đúng station không
      if (vehicle.stationId.toString() !== booking.pickupStation.toString()) {
        return res.status(400).json({
          success: false,
          message: "Xe không ở station đã chọn",
        });
      }

      // Gán xe (CHƯA chuyển trạng thái xe, đợi user thanh toán)
      booking.vehicle = vehicleId;
    }

    // PAID: User đã thanh toán thành công
    // Chuyển vehicle sang "rented" và tạo Rental record
    if (status === "paid") {
      // Chỉ cho phép paid từ confirmed
      if (currentStatus !== "confirmed") {
        return res.status(400).json({
          success: false,
          message: `Chỉ có thể thanh toán booking đã được xác nhận. Trạng thái hiện tại: ${currentStatus}`,
        });
      }

      if (!booking.vehicle) {
        return res.status(400).json({
          success: false,
          message: "Booking chưa được gán xe",
        });
      }

      // Update vehicle status to rented
      const vehicle = await Vehicle.findById(booking.vehicle);
      if (vehicle) {
        vehicle.status = "rented";
        await vehicle.save();
      }

      // TODO: Tạo Rental record ở đây (hoặc trigger từ Payment success)
      // const rental = await Rental.create({ ... });
    }

    // COMPLETED: Hoàn thành booking, trả xe về available
    if (status === "completed") {
      // Chỉ cho phép complete từ paid
      if (currentStatus !== "paid") {
        return res.status(400).json({
          success: false,
          message: `Chỉ có thể hoàn thành booking đã thanh toán. Trạng thái hiện tại: ${currentStatus}`,
        });
      }

      if (booking.vehicle) {
        const vehicle = await Vehicle.findById(booking.vehicle);
        if (vehicle) {
          vehicle.status = "available";
          await vehicle.save();
        }
      }

      // TODO: Update Rental record to completed
    }

    // CANCELLED: Hủy booking
    // Nếu đã gán xe nhưng chưa paid, trả vehicle về available
    if (status === "cancelled") {
      if (booking.vehicle) {
        const vehicle = await Vehicle.findById(booking.vehicle);
        // Chỉ trả về available nếu chưa paid (chưa rented)
        if (vehicle && vehicle.status === "available") {
          // Vehicle đã gán nhưng user chưa thanh toán, không cần làm gì
        } else if (vehicle && vehicle.status === "rented" && currentStatus !== "completed") {
          // Nếu đã thanh toán (rented) thì trả về available
          vehicle.status = "available";
          await vehicle.save();
        }
      }

      // TODO: Cancel/refund Payment nếu đã paid
    }

    // EXPIRED: Đánh dấu booking hết hạn
    // Chỉ auto-expire booking ở trạng thái pending
    if (status === "expired") {
      if (currentStatus !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể đánh dấu expired cho booking ở trạng thái pending",
        });
      }
    }

    // Update booking status
    booking.status = status;
    await booking.save();

    // Populate để trả về đầy đủ thông tin
    const updatedBooking = await Booking.findById(id)
      .populate("brand", "name code baseDailyRate")
      .populate("pickupStation", "name code address")
      .populate("vehicle", "vin plateNo model status");

    res.json({
      success: true,
      message: `Cập nhật trạng thái booking thành công: ${currentStatus} → ${status}`,
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
