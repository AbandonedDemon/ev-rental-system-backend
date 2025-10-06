import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return;
  }

  const uri =
    process.env.ATLAS_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/ev-rental-system";

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;
