import { Router } from "express";
import {
  listHandovers,
  getHandover,
  createHandover,
  updateHandover,
  deleteHandover,
} from "../controllers/handover.controller.js";
import authGuard from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authGuard("admin", "staff"), listHandovers);
router.get("/:id", authGuard("admin", "staff"), getHandover);
router.post("/", authGuard("admin", "staff"), createHandover);
router.put("/:id", authGuard("admin", "staff"), updateHandover);
router.delete("/:id", authGuard("admin"), deleteHandover);

export default router;
