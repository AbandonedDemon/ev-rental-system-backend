import "dotenv/config";
import payos, { isPayosConfigured } from "./src/config/payos.js";

console.log("\n🔍 PayOS Configuration Check\n");
console.log("=" .repeat(50));

// Check environment variables
console.log("\n📋 Environment Variables:");
console.log("  PAYOS_CLIENT_ID:", process.env.PAYOS_CLIENT_ID ? "✅ Set" : "❌ Missing");
console.log("  PAYOS_API_KEY:", process.env.PAYOS_API_KEY ? "✅ Set" : "❌ Missing");
console.log("  PAYOS_CHECKSUM_KEY:", process.env.PAYOS_CHECKSUM_KEY ? "✅ Set" : "❌ Missing");
console.log("  FRONTEND_URL:", process.env.FRONTEND_URL || "❌ Not set (default will be used)");

// Check configuration status
console.log("\n⚙️  Configuration Status:");
console.log("  isPayosConfigured:", isPayosConfigured ? "✅ Yes" : "❌ No");
console.log("  PayOS Client:", payos ? "✅ Initialized" : "❌ Not initialized");

// Display masked credentials (for verification)
if (isPayosConfigured) {
  console.log("\n🔑 Credentials (masked):");
  const maskCredential = (str) => {
    if (!str) return "N/A";
    if (str.length <= 8) return "***";
    return str.substring(0, 4) + "..." + str.substring(str.length - 4);
  };
  
  console.log("  Client ID:", maskCredential(process.env.PAYOS_CLIENT_ID));
  console.log("  API Key:", maskCredential(process.env.PAYOS_API_KEY));
  console.log("  Checksum Key:", maskCredential(process.env.PAYOS_CHECKSUM_KEY));
}

// API endpoints
console.log("\n🌐 Available Endpoints:");
console.log("  POST /api/payos/checkout");
console.log("    - Create real PayOS payment link");
console.log("    - Body: { bookingId: string }");
console.log("\n  POST /api/payos/webhook");
console.log("    - PayOS webhook handler (called by PayOS)");
console.log("\n  POST /api/payments/checkout/test");
console.log("    - Fake checkout for testing (bypass PayOS)");

// Payment flow
console.log("\n🔄 Payment Flow:");
console.log("  1. User creates booking → CREATED");
console.log("  2. Staff approves → APPROVED");
console.log("  3. System confirms → WAITING_PAYMENT");
console.log("  4. Call POST /api/payos/checkout → Get payment link");
console.log("  5. User completes payment on PayOS");
console.log("  6. PayOS sends webhook → Backend processes");
console.log("  7. Booking → PAID, Rental → READY_FOR_PICKUP");

// Testing recommendations
console.log("\n🧪 Testing Recommendations:");
if (isPayosConfigured) {
  console.log("  ✅ PayOS is configured - Ready for real payments!");
  console.log("  📝 Next steps:");
  console.log("     1. Start server: npm run dev");
  console.log("     2. Open Swagger: http://localhost:4000/api-docs");
  console.log("     3. Create test booking");
  console.log("     4. Call POST /api/payos/checkout");
  console.log("     5. Open returned checkoutUrl in browser");
  console.log("     6. Complete payment (use PayOS test cards)");
  console.log("\n  🌍 For localhost webhook testing:");
  console.log("     1. Install ngrok: npm install -g ngrok");
  console.log("     2. Run: ngrok http 4000");
  console.log("     3. Copy HTTPS URL to PayOS dashboard webhook settings");
} else {
  console.log("  ⚠️  PayOS not configured - Only fake checkout available");
  console.log("  📝 To enable real payments:");
  console.log("     1. Add PayOS credentials to .env file");
  console.log("     2. Restart server");
  console.log("     3. Verify with: node verify-payos.js");
}

console.log("\n" + "=".repeat(50));
console.log("✨ PayOS verification complete!\n");
