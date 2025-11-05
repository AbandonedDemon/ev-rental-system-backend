import dotenv from "dotenv";
import mongoose from "mongoose";
import { BOOKING_STATUS, PAYMENT_METHOD } from "./src/constants/statusCodes.js";
import Booking from "./src/models/booking.model.js";
import Payment from "./src/models/payment.model.js";

dotenv.config();

const testCheckout = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.ATLAS_URI;
    if (!mongoUri) {
      console.error("❌ MONGO_URI or ATLAS_URI not found in .env");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected\n");

    // Tìm hoặc tạo một booking test với status WAITING_PAYMENT
    let booking = await Booking.findOne({
      status: BOOKING_STATUS.WAITING_PAYMENT,
    });

    if (!booking) {
      console.log("⚠️  No booking with WAITING_PAYMENT status found");
      console.log("Creating a test booking...\n");

      // Lấy brand và station đầu tiên
      const brand = await mongoose.connection.db.collection("brands").findOne();
      const station = await mongoose.connection.db
        .collection("stations")
        .findOne();
      const renter = await mongoose.connection.db
        .collection("users")
        .findOne({ role: "renter" });

      if (!brand || !station || !renter) {
        console.log(
          "❌ Missing required data (brand/station/renter). Run seed first."
        );
        process.exit(1);
      }

      booking = await Booking.create({
        bookingCode: `BK${Date.now()}`,
        renter: renter._id,
        brand: brand._id,
        pickupStation: station._id,
        returnStation: station._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        rentalDays: 3,
        baseAmount: brand.baseDailyRate * 3,
        depositAmount: brand.depositAmount,
        totalAmount: brand.baseDailyRate * 3 + brand.depositAmount,
        status: BOOKING_STATUS.WAITING_PAYMENT,
      });

      console.log(`✅ Created test booking: ${booking.bookingCode}`);
    } else {
      console.log(`📋 Using existing booking: ${booking.bookingCode}`);
    }

    console.log(`Booking ID: ${booking._id}`);
    console.log(`Booking Status: ${booking.status}\n`);

    // Test các payment methods
    const methodsToTest = [
      { name: "bank_transfer", expected: "Should work ✅" },
      { name: "cash", expected: "Should work ✅" },
      { name: "credit_card", expected: "Should work ✅" },
      { name: "e_wallet", expected: "Should work ✅" },
    ];

    console.log("🧪 Testing payment methods:\n");

    for (const { name, expected } of methodsToTest) {
      try {
        // Simulate API call
        const testPayment = {
          booking: booking._id,
          method: name,
          status: "SUCCESS",
          txnRef: `TEST-${name}-${Date.now()}`,
          baseAmount: booking.baseAmount,
          depositAmount: booking.depositAmount,
          surchargeAmount: 0,
          totalAmount: booking.totalAmount,
        };

        const payment = await Payment.create(testPayment);

        console.log(`✅ ${name}: ${expected}`);
        console.log(`   Payment ID: ${payment._id}`);
        console.log(`   Method saved: ${payment.method}\n`);

        // Delete test payment sau khi verify
        await Payment.deleteOne({ _id: payment._id });
      } catch (error) {
        console.log(`❌ ${name}: FAILED`);
        console.log(`   Error: ${error.message}\n`);
      }
    }

    // Test với method sai để verify validation
    console.log("🧪 Testing invalid method (should fail):\n");
    try {
      await Payment.create({
        booking: booking._id,
        method: "BANK_TRANSFER", // UPPERCASE - should fail
        status: "SUCCESS",
        txnRef: "TEST-INVALID",
        baseAmount: booking.baseAmount,
        depositAmount: booking.depositAmount,
        surchargeAmount: 0,
        totalAmount: booking.totalAmount,
      });
      console.log("❌ UPPERCASE method was accepted (UNEXPECTED)\n");
    } catch (error) {
      console.log("✅ UPPERCASE method rejected (EXPECTED)");
      console.log(`   Error: ${error.message}\n`);
    }

    console.log("📝 Valid payment methods:");
    console.log(`   ${Object.values(PAYMENT_METHOD).join(", ")}\n`);

    await mongoose.disconnect();
    console.log("✅ Test complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

testCheckout();
