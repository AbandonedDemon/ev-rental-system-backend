import { Router } from "express";
import {
  listPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  createTestCheckout,
} from "../controllers/payment.controller.js";

const router = Router();

router.get("/", listPayments);
router.get("/:id", getPayment);
router.post("/checkout/test", createTestCheckout);
router.post("/", createPayment);
router.put("/:id", updatePayment);
router.delete("/:id", deletePayment);

export default router;
