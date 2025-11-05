import "dotenv/config";
import { PayOS } from "@payos/node";

const hasPayosCredentials =
  Boolean(process.env.PAYOS_CLIENT_ID) &&
  Boolean(process.env.PAYOS_API_KEY) &&
  Boolean(process.env.PAYOS_CHECKSUM_KEY);

let payosClient;

if (hasPayosCredentials) {
  payosClient = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
  });
} else {
  // Minimal stub so the app can boot even when PayOS is not configured.
  payosClient = {
    isConfigured: false,
    paymentRequests: {
      async create() {
        throw new Error("PayOS credentials are not configured");
      },
    },
  };
}

export const isPayosConfigured = hasPayosCredentials;
export default payosClient;
