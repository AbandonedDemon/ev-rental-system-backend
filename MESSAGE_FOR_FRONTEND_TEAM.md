# 📨 Message for Frontend Team

---

## 🎉 Good News: Backend sẵn sàng cho thanh toán thật!

Chào team Frontend,

Backend đã **hoàn toàn sẵn sàng** để xử lý thanh toán thật với PayOS rồi nhé! 🚀

## ✅ Những gì đã hoàn thành (Backend)

1. ✅ PayOS SDK đã được cài đặt và cấu hình
2. ✅ API endpoint cho thanh toán thật: `POST /api/payos/checkout`
3. ✅ Webhook handler để nhận kết quả thanh toán từ PayOS
4. ✅ Tự động cập nhật booking status sau khi thanh toán thành công
5. ✅ Tự động tạo rental khi thanh toán xong
6. ✅ Security: Webhook signature verification, duplicate prevention
7. ✅ Documentation đầy đủ với Swagger UI

## 🔄 Thay đổi cần thực hiện (Frontend)

### 1️⃣ Thay đổi API call thanh toán

**Cũ (fake checkout):**

```typescript
const response = await api.post("/api/payments/checkout/test", {
  bookingId: booking._id,
  method: "bank_transfer",
});
// Booking ngay lập tức chuyển sang PAID
```

**Mới (real checkout):**

```typescript
const response = await api.post("/api/payos/checkout", {
  bookingId: booking._id,
});

const { orderCode, checkoutData } = response.data;

// Redirect user đến trang thanh toán PayOS
window.location.href = checkoutData.checkoutUrl;

// Hoặc mở trong tab mới:
// window.open(checkoutData.checkoutUrl, '_blank');
```

### 2️⃣ Tạo trang xử lý kết quả thanh toán

**Return page** (`/payos/return`):

```typescript
// pages/payos/return.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

export default function PayOSReturnPage() {
  const router = useRouter();
  const { b: bookingId } = router.query; // booking ID từ URL

  useEffect(() => {
    if (!bookingId) return;

    // Poll booking status vì webhook xử lý async
    const checkPaymentStatus = async () => {
      try {
        const booking = await getBooking(bookingId);

        if (booking.status === "PAID") {
          toast.success("Thanh toán thành công! 🎉");
          router.push(`/bookings/${bookingId}`);
        } else {
          // Tiếp tục check sau 2 giây
          setTimeout(checkPaymentStatus, 2000);
        }
      } catch (error) {
        toast.error("Không thể xác minh thanh toán");
        router.push(`/bookings/${bookingId}`);
      }
    };

    checkPaymentStatus();
  }, [bookingId]);

  return (
    <div className="payment-processing">
      <Spinner />
      <h2>Đang xử lý thanh toán...</h2>
      <p>Vui lòng đợi trong giây lát</p>
    </div>
  );
}
```

**Cancel page** (`/payos/cancel`):

```typescript
// pages/payos/cancel.tsx
export default function PayOSCancelPage() {
  const router = useRouter();
  const { b: bookingId } = router.query;

  useEffect(() => {
    if (bookingId) {
      toast.warning("Bạn đã hủy thanh toán");
      router.push(`/bookings/${bookingId}`);
    }
  }, [bookingId]);

  return (
    <div className="payment-cancelled">
      <h2>Thanh toán đã bị hủy</h2>
      <p>Đang chuyển hướng...</p>
    </div>
  );
}
```

### 3️⃣ Update Payment Service

```typescript
// services/paymentService.ts

export interface PayOSCheckoutResponse {
  orderCode: string;
  checkoutData: {
    checkoutUrl: string;
    qrCode: string;
    accountNumber: string;
    amount: number;
    description: string;
  };
}

export const createPayOSCheckout = async (
  bookingId: string
): Promise<PayOSCheckoutResponse> => {
  try {
    const response = await api.post("/api/payos/checkout", {
      bookingId,
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      throw new Error("Booking chưa sẵn sàng để thanh toán");
    }
    if (error.response?.status === 502) {
      throw new Error("Lỗi kết nối cổng thanh toán. Vui lòng thử lại.");
    }
    throw new Error("Không thể tạo link thanh toán");
  }
};
```

### 4️⃣ Update Payment Button Component

```tsx
// components/PaymentButton.tsx

interface PaymentButtonProps {
  booking: Booking;
  onSuccess?: () => void;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  booking,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Tạo checkout link
      const { checkoutData } = await createPayOSCheckout(booking._id);

      // Redirect đến PayOS
      window.location.href = checkoutData.checkoutUrl;
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isPayable = booking.status === "WAITING_PAYMENT";

  return (
    <Button
      onClick={handlePayment}
      disabled={!isPayable || loading}
      variant="primary"
      size="large"
    >
      {loading ? (
        <>
          <Spinner size="sm" /> Đang tạo link thanh toán...
        </>
      ) : (
        <>
          <CreditCardIcon /> Thanh toán ngay
        </>
      )}
    </Button>
  );
};
```

## 📊 Payment Flow Mới

```
User                    Frontend              Backend              PayOS
 |                         |                      |                   |
 |-- Click "Pay" --------->|                      |                   |
 |                         |                      |                   |
 |                         |-- POST /payos/------>|                   |
 |                         |    checkout          |                   |
 |                         |                      |                   |
 |                         |                      |-- Create Link --->|
 |                         |                      |                   |
 |                         |<--- checkoutUrl -----|<------------------|
 |                         |                      |                   |
 |<-- Redirect to PayOS ---|                      |                   |
 |                         |                      |                   |
 |                                                                    |
 |-- Complete Payment on PayOS Page ---------------------------->|
 |                                                                    |
 |                         |                      |<-- Webhook -------|
 |                         |                      |    (payment done) |
 |                         |                      |                   |
 |                         |                      |-- Create Payment  |
 |                         |                      |-- Update Booking  |
 |                         |                      |-- Create Rental   |
 |                         |                      |                   |
 |<-- Return to /payos/return -------------------->|                   |
 |                         |                      |                   |
 |                         |-- Poll GET /bookings->|                   |
 |                         |    (every 2s)        |                   |
 |                         |                      |                   |
 |                         |<-- status: PAID -----|                   |
 |                         |                      |                   |
 |<-- Show Success --------|                      |                   |
```

## 🧪 Testing

### Development Mode (với fake payment)

Để test nhanh không cần vào PayOS:

```typescript
const USE_FAKE_PAYMENT = process.env.NODE_ENV === "development";

const createCheckout = async (bookingId: string) => {
  if (USE_FAKE_PAYMENT) {
    return api.post("/api/payments/checkout/test", { bookingId });
  }

  return api.post("/api/payos/checkout", { bookingId });
};
```

### Testing với PayOS thật

1. Start backend: `npm run dev`
2. Tạo booking qua Swagger: http://localhost:4000/api-docs
3. Call `/api/payos/checkout` với bookingId
4. Mở `checkoutUrl` trong browser
5. Complete payment (PayOS test mode)
6. Kiểm tra booking → status should be `PAID`

## 📝 Environment Variables

Frontend cần thêm (nếu chưa có):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
# hoặc production URL
```

Backend đã có sẵn:

```env
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
FRONTEND_URL=http://localhost:3000
```

## 📚 Documentation

Mình đã tạo documentation chi tiết:

1. **PAYOS_REAL_PAYMENT_GUIDE.md** - Full guide với mọi thứ cần biết
2. **PAYOS_QUICK_REFERENCE.md** - Quick reference card
3. **PAYMENT_IMPLEMENTATION_SUMMARY.md** - Summary & checklist
4. **Swagger UI** - http://localhost:4000/api-docs

## ⏱️ Estimated Work

- **Code changes**: ~1 hour

  - Update API call: 15 mins
  - Create return/cancel pages: 30 mins
  - Update payment button: 15 mins

- **Testing**: ~30 mins

  - Test complete flow
  - Handle edge cases

- **Total**: ~1.5 hours

## 🚀 Next Steps

1. [ ] Review documentation (PAYOS_QUICK_REFERENCE.md)
2. [ ] Update payment service với `/api/payos/checkout`
3. [ ] Create return & cancel pages
4. [ ] Update payment button component
5. [ ] Test end-to-end flow
6. [ ] Deploy & configure webhook URL on PayOS dashboard

## 💡 Notes

- **Backward compatible**: Fake checkout endpoint vẫn hoạt động bình thường
- **Webhook**: Backend tự động nhận và xử lý, frontend chỉ cần poll status
- **Return URL**: Backend đã config sẵn với FRONTEND_URL từ .env
- **Error handling**: Tất cả error cases đã được handle ở backend

## 🤝 Support

Nếu có bất kỳ câu hỏi nào hoặc gặp vấn đề:

1. Check documentation files
2. Test với Swagger UI
3. Check backend logs
4. Ping backend team

---

**Backend Status**: ✅ Production Ready  
**Frontend Work Needed**: ~1.5 hours  
**Priority**: Medium (có thể dùng fake checkout trong khi implement)

Happy coding! 🚀💳

---

Backend Team  
November 5, 2025
