# 🚀 Quick Reference: PayOS Real Payment

## ✅ Status Check
```bash
node verify-payos.js
```

## 🎯 API Endpoints

### 1️⃣ Create Real Payment
```http
POST /api/payos/checkout
Content-Type: application/json

{
  "bookingId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "orderCode": "123456789",
  "checkoutData": {
    "checkoutUrl": "https://pay.payos.vn/web/...",
    "qrCode": "https://img.vietqr.io/...",
    "amount": 500000
  }
}
```

### 2️⃣ Fake Payment (Testing)
```http
POST /api/payments/checkout/test
Content-Type: application/json

{
  "bookingId": "507f1f77bcf86cd799439011",
  "method": "bank_transfer"
}
```

## 📱 Frontend Integration

### Option A: Redirect
```typescript
const { checkoutData } = await createPayOSCheckout(bookingId);
window.location.href = checkoutData.checkoutUrl;
```

### Option B: QR Code
```tsx
<img src={checkoutData.qrCode} alt="QR Payment" />
<p>Scan to pay: {checkoutData.amount.toLocaleString()} VND</p>
```

### Option C: New Window
```typescript
window.open(checkoutData.checkoutUrl, '_blank');
```

## 🔄 Payment States

| Booking Status | Description | Next Action |
|----------------|-------------|-------------|
| CREATED | Just created | Staff approve |
| PENDING_APPROVAL | Waiting staff | Staff approve |
| APPROVED | Staff approved | Call `/payos/checkout` |
| WAITING_PAYMENT | Payment link created | User pays |
| PAID | Payment received | Rental created |

## 🧪 Testing Flow

### 1. Create Booking
```bash
POST /api/bookings
{
  "renterName": "Test User",
  "phoneNumber": "0123456789",
  "email": "test@example.com",
  "brand": "{brandId}",
  "pickupStation": "{stationId}",
  "pickupTimeExpected": "2025-12-01T10:00:00Z",
  "rentalDays": 3,
  "preferredPaymentMethod": "bank_transfer"
}
```

### 2. Approve (if needed)
```bash
PUT /api/bookings/{bookingId}/status
{
  "status": "APPROVED",
  "vehicleId": "{vehicleId}"
}
```

### 3. Create Checkout
```bash
POST /api/payos/checkout
{
  "bookingId": "{bookingId}"
}
```

### 4. Pay & Verify
- Open `checkoutUrl` → Complete payment
- Wait for webhook (2-5 seconds)
- Check: `GET /api/bookings/{bookingId}` → Should be PAID
- Check: `GET /api/rentals?booking={bookingId}` → Should exist

## 🐛 Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| "Booking must be waiting for payment" | Wrong status | Check booking.status |
| "PayOS credentials are not configured" | Missing env vars | Check .env file |
| Webhook not received | Can't reach localhost | Use ngrok |
| Payment created but booking not updated | Webhook failed | Check webhook logs |

## 🔗 Useful Links

- **Swagger UI**: http://localhost:4000/api-docs
- **PayOS Dashboard**: https://my.payos.vn/
- **Full Guide**: `PAYOS_REAL_PAYMENT_GUIDE.md`

## 💡 Tips

1. **Development**: Use fake checkout for speed
2. **Staging**: Test with real PayOS + ngrok
3. **Production**: Configure webhook URL on PayOS dashboard
4. **Debugging**: Check terminal logs for webhook calls

## 🎨 Frontend Examples

### React Hook
```typescript
const usePayment = () => {
  const [loading, setLoading] = useState(false);
  
  const createCheckout = async (bookingId: string) => {
    setLoading(true);
    try {
      const res = await api.post('/api/payos/checkout', { bookingId });
      return res.data;
    } finally {
      setLoading(false);
    }
  };
  
  return { createCheckout, loading };
};
```

### Payment Button
```tsx
<Button 
  onClick={async () => {
    const { checkoutData } = await createCheckout(booking._id);
    window.location.href = checkoutData.checkoutUrl;
  }}
  disabled={booking.status !== 'WAITING_PAYMENT'}
>
  Pay Now
</Button>
```

### Return Page Polling
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const booking = await getBooking(bookingId);
    if (booking.status === 'PAID') {
      clearInterval(interval);
      navigate(`/bookings/${bookingId}`);
    }
  }, 2000);
  
  return () => clearInterval(interval);
}, [bookingId]);
```

---

**🎯 Ready to go!** Backend đã hoàn toàn sẵn sàng cho thanh toán thật.
