import { Router } from "express";
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicle.controller.js";

const router = Router();

router.get("/", listVehicles);
router.get("/:id", getVehicle);
router.post("/", createVehicle);
router.put("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);

export default router;
