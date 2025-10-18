import { Router } from "express";
import {
  listStations,
  getStation,
  createStation,
  updateStation,
  deleteStation,
} from "../controllers/station.controller.js";
import authGuard from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listStations);
router.get("/:id", getStation);
router.post("/", authGuard("admin", "staff"), createStation);
router.put("/:id", authGuard("admin", "staff"), updateStation);
router.delete("/:id", authGuard("admin"), deleteStation);

export default router;
