import express from "express";
import {
  createBooking,
  listBookings,
  getBooking,
  cancelBooking,
} from "../controllers/booking.controller.js";

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
 *               - brandId
 *               - stationId
 *               - pickupDate
 *               - pickupTime
 *               - returnDate
 *               - returnTime
 *               - paymentMethod
 *               - agreedToPaymentTerms
 *               - agreedToDataSharing
 *             properties:
 *               renterName:
 *                 type: string
 *                 example: "Nguyen Thi Nhu Quynh"
 *               phoneNumber:
 *                 type: string
 *                 example: "0912345678"
 *               email:
 *                 type: string
 *                 example: "quynhntnss170152@fpt.edu.vn"
 *               brandId:
 *                 type: string
 *                 example: "673e5c123456789abcdef012"
 *               stationId:
 *                 type: string
 *                 example: "station-hn-01"
 *               pickupDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-01"
 *               pickupTime:
 *                 type: string
 *                 example: "10:00"
 *               returnDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-02"
 *               returnTime:
 *                 type: string
 *                 example: "10:00"
 *               paymentMethod:
 *                 type: string
 *                 enum: [online, cash, bank_transfer, credit_card, e_wallet]
 *                 example: "online"
 *               agreedToPaymentTerms:
 *                 type: boolean
 *                 example: true
 *               agreedToDataSharing:
 *                 type: boolean
 *                 example: true
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

export default router;
