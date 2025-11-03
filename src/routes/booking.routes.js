import express from "express";
import {
  createBooking,
  listBookings,
  getBooking,
  cancelBooking,
  updateBookingStatus,
} from "../controllers/booking.controller.js";
import authGuard from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Tạo booking mới (Đăng ký thuê xe)
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - renterName
 *               - phoneNumber
 *               - email
 *               - brand
 *               - pickupStation
 *               - pickupTimeExpected
 *               - rentalDays
 *               - paymentMethod
 *               - agreedToPaymentTerms
 *               - agreedToDataSharing
 *             properties:
 *               renterName:
 *                 type: string
 *                 description: Tên người thuê
 *                 example: "Như Quỳnh"
 *               phoneNumber:
 *                 type: string
 *                 description: Số điện thoại (10 số bắt đầu bằng 0)
 *                 example: "0387815790"
 *               email:
 *                 type: string
 *                 description: Email người thuê
 *                 example: "quynhtn2309@gmail.com"
 *               brand:
 *                 type: string
 *                 description: Brand ObjectId
 *                 example: "6907a4820222ed11d28fbe3a"
 *               pickupStation:
 *                 type: string
 *                 description: Station code hoặc ObjectId
 *                 example: "station-hcm-01"
 *               pickupTimeExpected:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian nhận xe dự kiến
 *                 example: "2025-11-12T03:00:00.000Z"
 *               rentalDays:
 *                 type: integer
 *                 minimum: 1
 *                 description: Số ngày thuê
 *                 example: 14
 *               paymentMethod:
 *                 type: string
 *                 enum: [online, cash, bank_transfer, credit_card, e_wallet]
 *                 example: "bank_transfer"
 *               agreedToPaymentTerms:
 *                 type: boolean
 *                 description: Đồng ý điều khoản thanh toán (phải true)
 *                 example: true
 *               agreedToDataSharing:
 *                 type: boolean
 *                 description: Đồng ý chia sẻ dữ liệu (phải true)
 *                 example: true
 *               renter:
 *                 type: string
 *                 description: User ObjectId (nếu đã đăng nhập)
 *                 example: null
 *               vehicle:
 *                 type: string
 *                 description: Vehicle ObjectId (optional, để staff assign sau)
 *                 example: "6907a4830222ed11d28fbe48"
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, paid, completed, cancelled, expired]
 *                 default: pending
 *                 example: "pending"
 *               surchargeAmount:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 description: Phụ phí thêm
 *                 example: 0
 *               notes:
 *                 type: string
 *                 description: Ghi chú
 *                 example: null
 *     responses:
 *       201:
 *         description: Đặt xe thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post("/", createBooking);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Lấy danh sách bookings
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending_payment, confirmed, cancelled, completed, expired]
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *       - in: query
 *         name: phoneNumber
 *         schema:
 *           type: string
 *       - in: query
 *         name: bookingCode
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/", listBookings);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Lấy chi tiết booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Booking not found
 */
router.get("/:id", getBooking);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   put:
 *     summary: Hủy booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hủy booking thành công
 *       400:
 *         description: Không thể hủy booking
 *       404:
 *         description: Booking not found
 */
router.put("/:id/cancel", cancelBooking);

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái booking (Staff/Admin only)
 *     description: |
 *       **Flow trạng thái booking:**
 *       1. `pending` - User tạo booking chọn Brand (chưa có xe cụ thể)
 *       2. `confirmed` - Staff xác nhận và GÁN XE cụ thể cho booking
 *       3. `paid` - User thấy xe đã gán, thanh toán thành công (tạo Rental)
 *       4. `completed` - Hoàn thành thuê xe, trả xe
 *       5. `cancelled` - Hủy booking (trả xe nếu đã gán)
 *       6. `expired` - Hết hạn (quá pickupDateTime mà vẫn pending)
 *       
 *       **Business Rules:**
 *       - `confirmed`: pending → confirmed (bắt buộc vehicleId, xe vẫn available)
 *       - `paid`: confirmed → paid (xe → rented, tạo Rental)
 *       - `completed`: paid → completed (xe → available, kết thúc Rental)
 *       - `cancelled`: any → cancelled (trả xe về available nếu cần)
 *       - `expired`: pending → expired (tự động bởi cron job)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, paid, completed, cancelled, expired]
 *                 example: "confirmed"
 *               vehicleId:
 *                 type: string
 *                 description: Required khi status = "confirmed"
 *                 example: "673e5c123456789abcdef999"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       400:
 *         description: Trạng thái không hợp lệ hoặc vi phạm business rules
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Booking not found
 */
router.put("/:id/status", authGuard("staff", "admin"), updateBookingStatus);

export default router;
