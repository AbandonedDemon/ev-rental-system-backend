import { PAYMENT_METHOD } from "./src/constants/statusCodes.js";

console.log("✅ Payment Method Constants:\n");
console.log("Available payment methods:");
Object.entries(PAYMENT_METHOD).forEach(([key, value]) => {
  console.log(`  ${key}: "${value}"`);
});

console.log("\n📝 Validation:");
console.log(
  `  Enum values: [${Object.values(PAYMENT_METHOD)
    .map((v) => `"${v}"`)
    .join(", ")}]`
);

console.log("\n✅ Frontend should send lowercase values:");
console.log("  - cash");
console.log("  - bank_transfer ✅ (NOW SUPPORTED)");
console.log("  - credit_card");
console.log("  - e_wallet");

console.log("\n❌ These will be REJECTED:");
console.log("  - BANK_TRANSFER (uppercase)");
console.log("  - card (old value)");
console.log("  - wallet (old value)");
console.log("  - transfer (old value)");
