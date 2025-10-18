import { Router } from "express";
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicle.controller.js";
import authGuard from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listVehicles);
router.get("/:id", getVehicle);
router.post("/", authGuard("admin", "staff"), createVehicle);
router.put("/:id", authGuard("admin", "staff"), updateVehicle);
router.delete("/:id", authGuard("admin"), deleteVehicle);

export default router;
