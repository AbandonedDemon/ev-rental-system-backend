import { Router } from "express";
import {
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
} from "../controllers/booking.controller.js";
import authGuard from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authGuard("admin", "staff"), listBookings);
router.get("/:id", authGuard("admin", "staff"), getBooking);
router.post("/", authGuard("admin", "staff", "renter"), createBooking);
router.put("/:id", authGuard("admin", "staff"), updateBooking);
router.delete("/:id", authGuard("admin", "staff"), deleteBooking);

export default router;
