import path from "path";
import UserDocument from "../models/userDocument.model.js";
import User from "../models/user.model.js";

const USER_DOCUMENT_POPULATE = ["user", "verifiedBy"];

const mapUploadedFile = (file) =>
  file ? path.relative(process.cwd(), file.path).split(path.sep).join("/") : null;

export const listUserDocuments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.userId) {
      filter.user = req.query.userId;
    }

    const documents = await UserDocument.find(filter)
      .sort({ createdAt: -1 })
      .populate(USER_DOCUMENT_POPULATE);

    res.json({ data: documents });
  } catch (error) {
    next(error);
  }
};

export const getUserDocument = async (req, res, next) => {
  try {
    const document = await UserDocument.findById(req.params.id).populate(USER_DOCUMENT_POPULATE);
    if (!document) {
      return res.status(404).json({ message: "User document not found" });
    }
    res.json({ data: document });
  } catch (error) {
    next(error);
  }
};

export const createUserDocument = async (req, res, next) => {
  try {
    const {
      user,
      documentType = "national_id",
      identityNumber,
      drivingLicenseNumber,
      notes,
    } = req.body;

    if (!user || !identityNumber || !drivingLicenseNumber) {
      return res.status(400).json({
        message: "user, identityNumber and drivingLicenseNumber are required",
      });
    }

    const userDoc = await User.findById(user);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const frontImage = mapUploadedFile(req.files?.frontImage?.[0]);
    const backImage = mapUploadedFile(req.files?.backImage?.[0]);
    const drivingLicenseImage = mapUploadedFile(req.files?.drivingLicenseImage?.[0]);

    if (!frontImage || !backImage || !drivingLicenseImage) {
      return res.status(400).json({
        message: "frontImage, backImage and drivingLicenseImage files are required",
      });
    }

    const document = await UserDocument.create({
      user,
      documentType,
      identityNumber,
      drivingLicenseNumber,
      frontImageUrl: frontImage,
      backImageUrl: backImage,
      drivingLicenseImageUrl: drivingLicenseImage,
      status: "pending",
      notes: notes ?? null,
      submittedAt: new Date(),
    });

    if (userDoc.status === "pending_documents") {
      userDoc.status = "documents_submitted";
      await userDoc.save();
    }

    const populated = await document.populate(USER_DOCUMENT_POPULATE);

    res.status(201).json({ data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateUserDocument = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    if (updates.status === "verified") {
      updates.verifiedAt = new Date();
    }

    const document = await UserDocument.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate(USER_DOCUMENT_POPULATE);

    if (!document) {
      return res.status(404).json({ message: "User document not found" });
    }

    if (updates.status) {
      const user = await User.findById(document.user);
      if (user) {
        if (updates.status === "verified") {
          user.status = "verified";
        } else if (updates.status === "pending" || updates.status === "under_review") {
          user.status = "documents_submitted";
        } else if (updates.status === "rejected") {
          user.status = "pending_documents";
        }
        await user.save();
      }
    }

    res.json({ data: document });
  } catch (error) {
    next(error);
  }
};

export const deleteUserDocument = async (req, res, next) => {
  try {
    const document = await UserDocument.findByIdAndDelete(req.params.id);
    if (!document) {
      return res.status(404).json({ message: "User document not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export default {
  listUserDocuments,
  getUserDocument,
  createUserDocument,
  updateUserDocument,
  deleteUserDocument,
};
