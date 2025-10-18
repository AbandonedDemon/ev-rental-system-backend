import { Router } from "express";
import {
  listPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
} from "../controllers/payment.controller.js";
import authGuard from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authGuard("admin", "staff"), listPayments);
router.get("/:id", authGuard("admin", "staff"), getPayment);
router.post("/", authGuard("admin", "staff"), createPayment);
router.put("/:id", authGuard("admin", "staff"), updatePayment);
router.delete("/:id", authGuard("admin"), deletePayment);

export default router;
