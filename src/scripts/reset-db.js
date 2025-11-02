import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/mongodb.js";

// Load environment variables
dotenv.config();

const resetDatabase = async () => {
  try {
    console.log("🗑️  Starting database reset...");

    // Connect to MongoDB
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Drop database
    await mongoose.connection.db.dropDatabase();
    console.log("✅ Database dropped successfully!");

    // Exit the process
    process.exit(0);
  } catch (error) {
    console.error("❌ Database reset failed:", error.message);
    process.exit(1);
  }
};

resetDatabase();
