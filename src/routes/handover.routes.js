import { Router } from "express";
import {
  listHandovers,
  getHandover,
  createHandover,
  updateHandover,
  deleteHandover,
} from "../controllers/handover.controller.js";
import { handoverUpload } from "../middleware/upload.middleware.js";

const router = Router();

router.get("/", listHandovers);
router.get("/:id", getHandover);
router.post("/", handoverUpload.array("photos", 6), createHandover);
router.put("/:id", updateHandover);
router.delete("/:id", deleteHandover);

export default router;
