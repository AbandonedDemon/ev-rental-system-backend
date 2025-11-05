# PayOS Real Payment Implementation Guide

## 🎯 Overview
Backend đã **hoàn toàn sẵn sàng** để xử lý thanh toán thật với PayOS! Tất cả các thành phần đã được implement và test.

## ✅ Current Implementation Status

### 1. PayOS Configuration ✓
- **File**: `src/config/payos.js`
- **Status**: Hoàn thành
- **Features**:
  - PayOS SDK initialized với credentials từ .env
  - Graceful fallback khi thiếu credentials
  - Export `isPayosConfigured` để check trạng thái

### 2. Environment Variables ✓
```env
PAYOS_API_KEY="619c3e27-0acc-4c40-9935-9e5f2fda02b5"
PAYOS_CHECKSUM_KEY="9a218f53fe5250e9f9719cc46ee6b5a33f4a4cad8e5ea07c058854cd7c6b5c63"
PAYOS_CLIENT_ID="379748f1-7aa5-4ca5-a4e6-6460967c0f01"
FRONTEND_URL="http://localhost:3000"  # Hoặc production URL
```

### 3. Payment Flow Endpoints ✓

#### A. Real Checkout Endpoint
**POST** `/api/payos/checkout`

```javascript
{
  "bookingId": "507f1f77bcf86cd799439011"
}
```

**Flow**:
1. Confirm booking nếu đang PENDING_APPROVAL → WAITING_PAYMENT
2. Validate booking status = WAITING_PAYMENT
3. Tạo PayOS payment link với returnUrl & cancelUrl
4. Tạo PaymentIntent record để track order
5. Return checkout URL cho frontend

**Response**:
```javascript
{
  "orderCode": "123456789",
  "checkoutData": {
    "checkoutUrl": "https://pay.payos.vn/web/...",
    "qrCode": "https://img.vietqr.io/...",
    "accountNumber": "...",
    "amount": 500000
  }
}
```

#### B. PayOS Webhook Handler
**POST** `/api/payos/webhook`

**Flow** (Automatic from PayOS):
1. Verify webhook signature với PAYOS_CHECKSUM_KEY
2. Tìm PaymentIntent bằng orderCode
3. Check duplicate payment
4. Create Payment record với status SUCCESS
5. Update Booking status → PAID
6. Trigger rental creation (via booking status hook)
7. Update PaymentIntent status → captured

### 4. Database Models ✓

#### PaymentIntent Schema
```javascript
{
  orderCode: String,      // Unique identifier from PayOS
  bookingId: ObjectId,    // Reference to booking
  amount: Number,         // Payment amount
  status: String,         // created | captured | refund_pending | cancelled
  createdAt: Date,
  updatedAt: Date
}
```

#### Payment Schema
```javascript
{
  booking: ObjectId,
  rental: ObjectId,
  method: String,         // "cash" | "bank_transfer" | "credit_card" | "e_wallet"
  status: String,         // SUCCESS | PENDING | FAILED | REFUNDED
  amount: Number,
  txnRef: String,         // orderCode from PayOS
  processedBy: ObjectId,
  createdAt: Date
}
```

### 5. API Documentation ✓
- Swagger UI: http://localhost:4000/api-docs
- Tag: "PayOS" với 2 endpoints documented
- Request/Response schemas complete

---

## 🚀 Implementation Steps

### Backend (Đã hoàn thành ✅)
Không cần làm gì thêm! Tất cả đã sẵn sàng.

### Frontend Implementation

#### Step 1: Update Payment Flow
Replace fake checkout với real PayOS checkout:

```typescript
// services/paymentService.ts

export const createPayOSCheckout = async (bookingId: string) => {
  try {
    const response = await api.post('/api/payos/checkout', {
      bookingId
    });
    
    return response.data; // { orderCode, checkoutData }
  } catch (error) {
    if (error.response?.status === 409) {
      throw new Error('Booking is not ready for payment');
    }
    if (error.response?.status === 502) {
      throw new Error('Payment gateway error. Please try again.');
    }
    throw error;
  }
};
```

#### Step 2: Update Payment Button
```tsx
// components/BookingPayment.tsx

const handlePayment = async () => {
  try {
    setLoading(true);
    
    // Create checkout link
    const { orderCode, checkoutData } = await createPayOSCheckout(booking._id);
    
    // Redirect to PayOS
    window.location.href = checkoutData.checkoutUrl;
    
    // Or open in new tab
    // window.open(checkoutData.checkoutUrl, '_blank');
    
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

#### Step 3: Handle Return URLs
```tsx
// pages/payos/return.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PayOSReturnPage() {
  const router = useRouter();
  const { b: bookingId, orderCode, status } = router.query;
  
  useEffect(() => {
    if (!bookingId) return;
    
    // Poll booking status
    const pollBookingStatus = async () => {
      try {
        const booking = await getBooking(bookingId);
        
        if (booking.status === 'PAID') {
          toast.success('Payment successful!');
          router.push(`/bookings/${bookingId}`);
        } else {
          // Keep polling or show pending state
          setTimeout(pollBookingStatus, 2000);
        }
      } catch (error) {
        toast.error('Failed to verify payment');
        router.push(`/bookings/${bookingId}`);
      }
    };
    
    pollBookingStatus();
  }, [bookingId]);
  
  return (
    <div className="payment-processing">
      <Spinner />
      <p>Processing your payment...</p>
    </div>
  );
}
```

```tsx
// pages/payos/cancel.tsx

export default function PayOSCancelPage() {
  const router = useRouter();
  const { b: bookingId } = router.query;
  
  useEffect(() => {
    if (bookingId) {
      toast.warning('Payment cancelled');
      router.push(`/bookings/${bookingId}`);
    }
  }, [bookingId]);
  
  return (
    <div className="payment-cancelled">
      <p>Payment cancelled. Redirecting...</p>
    </div>
  );
}
```

#### Step 4: Update Environment Variables
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
# or production
NEXT_PUBLIC_API_URL=https://your-backend.ondigitalocean.app
```

---

## 🧪 Testing Guide

### 1. Test Real Payment Flow (Development)

**Step 1: Create Booking**
```bash
POST http://localhost:4000/api/bookings
{
  "renterName": "Test User",
  "phoneNumber": "0123456789",
  "email": "test@example.com",
  "brand": "507f1f77bcf86cd799439011",
  "pickupStation": "507f1f77bcf86cd799439012",
  "pickupTimeExpected": "2025-12-01T10:00:00Z",
  "rentalDays": 3,
  "preferredPaymentMethod": "bank_transfer"
}
```

**Step 2: Staff Approve Booking (if needed)**
```bash
PUT http://localhost:4000/api/bookings/{bookingId}/status
{
  "status": "APPROVED",
  "vehicleId": "507f1f77bcf86cd799439013"
}
```

**Step 3: Create PayOS Checkout**
```bash
POST http://localhost:4000/api/payos/checkout
{
  "bookingId": "507f1f77bcf86cd799439011"
}
```

**Expected Response**:
```json
{
  "orderCode": "123456789",
  "checkoutData": {
    "checkoutUrl": "https://pay.payos.vn/web/...",
    "qrCode": "https://img.vietqr.io/...",
    "accountNumber": "0123456789",
    "amount": 500000,
    "description": "Payment #123456789",
    "accountName": "YOUR_BUSINESS_NAME",
    "bin": "970422"
  }
}
```

**Step 4: Open checkout URL in browser**
- User completes payment on PayOS
- PayOS sends webhook to `/api/payos/webhook`
- Backend creates Payment record
- Booking status → PAID
- Rental automatically created → READY_FOR_PICKUP

**Step 5: Verify Payment**
```bash
GET http://localhost:4000/api/bookings/{bookingId}
# Should see status: "PAID"

GET http://localhost:4000/api/payments?booking={bookingId}
# Should see payment record with status: "SUCCESS"

GET http://localhost:4000/api/rentals?booking={bookingId}
# Should see rental with status: "READY_FOR_PICKUP"
```

### 2. Test Webhook Locally (Development)

Để test webhook trên localhost, dùng ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 4000

# Copy HTTPS URL (e.g., https://abc123.ngrok.io)
```

Cấu hình webhook URL trên PayOS Dashboard:
```
Webhook URL: https://abc123.ngrok.io/api/payos/webhook
```

---

## 🔒 Security Features

### 1. Webhook Signature Verification ✓
```javascript
// Automatically verifies every webhook request
const verifySig = (data, signature) => {
  const key = process.env.PAYOS_CHECKSUM_KEY;
  const s = Object.keys(data)
    .sort()
    .map((k) => `${k}=${encodeURI(data[k] ?? "")}`)
    .join("&");
  const h = crypto.createHmac("sha256", key).update(s).digest("hex");
  return h === signature;
};
```

### 2. Duplicate Payment Prevention ✓
- Check existing payment với txnRef = orderCode
- Sử dụng MongoDB transaction để đảm bảo atomicity

### 3. Booking Status Validation ✓
- Chỉ cho phép thanh toán khi booking WAITING_PAYMENT
- Strict status transition flow

---

## 📊 Payment Flow Diagram

```
USER                    FRONTEND              BACKEND              PAYOS
 |                         |                      |                   |
 |-- Click Pay ----------->|                      |                   |
 |                         |                      |                   |
 |                         |-- POST /payos/------>|                   |
 |                         |    checkout          |                   |
 |                         |                      |                   |
 |                         |                      |-- Create Link --->|
 |                         |                      |                   |
 |                         |<---- Checkout URL ---|<------------------|
 |                         |                      |                   |
 |<-- Redirect to PayOS ---|                      |                   |
 |                         |                      |                   |
 |                         |                      |                   |
 |-- Complete Payment ----------------------------->|                   |
 |    (on PayOS page)                             |                   |
 |                         |                      |                   |
 |                         |                      |<-- Webhook -------|
 |                         |                      |    (payment done) |
 |                         |                      |                   |
 |                         |                      |-- Verify Sig      |
 |                         |                      |-- Create Payment  |
 |                         |                      |-- Update Booking  |
 |                         |                      |-- Create Rental   |
 |                         |                      |                   |
 |<-- Return to Frontend --|<-- returnUrl --------|                   |
 |    (with success)       |                      |                   |
 |                         |                      |                   |
 |                         |-- GET /bookings/---->|                   |
 |                         |    {id}              |                   |
 |                         |                      |                   |
 |                         |<-- Status: PAID -----|                   |
 |                         |                      |                   |
```

---

## 🎭 Comparison: Fake vs Real Payment

| Feature | Fake Checkout (`/test`) | Real PayOS (`/payos/checkout`) |
|---------|------------------------|-------------------------------|
| **Endpoint** | POST `/api/payments/checkout/test` | POST `/api/payos/checkout` |
| **Payment** | Instant success | User completes on PayOS |
| **Webhook** | ❌ No | ✅ Yes |
| **Transaction ID** | `TEST-{timestamp}` | Real orderCode from PayOS |
| **User Flow** | API call only | Redirect → Pay → Return |
| **Status Update** | Immediate | Async via webhook |
| **Use Case** | Development/Testing | Production |
| **Money** | 💸 Free | 💰 Real money |

---

## 🔄 Migration from Fake to Real

### Remove Fake Checkout Usage

**Before** (Fake):
```typescript
const response = await api.post('/api/payments/checkout/test', {
  bookingId,
  method: 'bank_transfer'
});
// Booking instantly PAID
```

**After** (Real):
```typescript
const { checkoutUrl } = await api.post('/api/payos/checkout', {
  bookingId
});
window.location.href = checkoutUrl;
// User completes payment → webhook → PAID
```

### Keep Fake Checkout for Testing
Bạn có thể giữ cả hai:
- **Development**: Dùng fake checkout để test nhanh
- **Production**: Dùng real PayOS checkout

```typescript
const createCheckout = async (bookingId: string, useFake = false) => {
  if (useFake && process.env.NODE_ENV === 'development') {
    return api.post('/api/payments/checkout/test', { bookingId });
  }
  
  return api.post('/api/payos/checkout', { bookingId });
};
```

---

## 🐛 Troubleshooting

### Issue 1: "PayOS credentials are not configured"
**Cause**: Missing environment variables
**Fix**: 
```bash
# Verify .env file
cat .env | grep PAYOS

# Should see:
# PAYOS_API_KEY=...
# PAYOS_CHECKSUM_KEY=...
# PAYOS_CLIENT_ID=...
```

### Issue 2: Webhook not received
**Cause**: PayOS can't reach localhost
**Fix**: Use ngrok or deploy to public server
```bash
ngrok http 4000
# Update webhook URL on PayOS dashboard
```

### Issue 3: "Booking must be waiting for payment"
**Cause**: Booking not in WAITING_PAYMENT status
**Fix**: 
1. Check booking status: GET `/api/bookings/{id}`
2. If PENDING_APPROVAL, staff must approve first
3. If APPROVED, call `/payos/checkout` to auto-transition

### Issue 4: Payment created but booking not updated
**Cause**: Webhook failed or signature mismatch
**Fix**:
1. Check webhook logs in terminal
2. Verify PAYOS_CHECKSUM_KEY matches PayOS dashboard
3. Check PaymentIntent was created with correct orderCode

---

## 🎯 Next Steps

### 1. Test Payment Flow (5 mins)
```bash
# Start backend
npm run dev

# Create test booking via Swagger UI
# http://localhost:4000/api-docs

# Call POST /api/payos/checkout
# Open returned checkoutUrl in browser
# Complete fake payment on PayOS test mode
```

### 2. Frontend Integration (30 mins)
- Update payment button to call `/api/payos/checkout`
- Create return & cancel pages
- Add polling for booking status

### 3. Configure PayOS Webhook (5 mins)
- Login to PayOS Dashboard
- Set webhook URL: `https://your-domain.com/api/payos/webhook`
- Test webhook with PayOS test tools

### 4. Production Deployment
- Ensure all PAYOS_* env vars are set
- Verify FRONTEND_URL points to production domain
- Test complete flow on staging first

---

## 📝 Summary

✅ **Backend hoàn toàn sẵn sàng cho thanh toán thật!**

**What's already done:**
- ✅ PayOS SDK configured
- ✅ Checkout endpoint implemented
- ✅ Webhook handler với signature verification
- ✅ Payment & PaymentIntent models
- ✅ Booking status automation
- ✅ Rental creation after payment
- ✅ Swagger documentation
- ✅ Error handling
- ✅ Security measures

**What you need to do:**
1. Frontend: Call `/api/payos/checkout` thay vì `/test`
2. Frontend: Create return & cancel pages
3. Frontend: Poll booking status after payment
4. Deploy: Configure webhook URL trên PayOS Dashboard

**Estimated Frontend Work**: ~1-2 hours

Happy implementing! 🚀💳
