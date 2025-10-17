import { Router } from "express";
import {
  listUserDocuments,
  getUserDocument,
  createUserDocument,
  updateUserDocument,
  deleteUserDocument,
} from "../controllers/userDocument.controller.js";
import { documentUpload } from "../middleware/upload.middleware.js";

const router = Router();

router.get("/", listUserDocuments);
router.get("/:id", getUserDocument);
router.post(
  "/",
  documentUpload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
    { name: "drivingLicenseImage", maxCount: 1 },
  ]),
  createUserDocument,
);
router.put("/:id", updateUserDocument);
router.delete("/:id", deleteUserDocument);

export default router;
