# 🚀 FRONTEND INTEGRATION GUIDE - EV Rental System

## 📋 TOÀN BỘ FLOW CHÍNH (Main Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE RENTAL FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. BOOKING PHASE (Đặt xe)
   ├─ Customer tạo booking
   ├─ Staff approve booking
   ├─ Customer thanh toán qua PayOS
   └─ Booking status: PAID ✅

2. RENTAL CREATION (Backend tự động)
   ├─ Background Job tự động tạo Rental
   └─ Rental status: READY_FOR_PICKUP ✅

3. CHECK-IN PHASE (Nhận xe)
   ├─ Staff xác nhận khách check-in
   ├─ Rental status: CHECKED_IN
   ├─ Customer ký hợp đồng điện tử
   ├─ Rental status: IN_PROGRESS ✅
   └─ Booking status: SUCCESS ✅

4. USAGE PHASE (Đang sử dụng)
   ├─ Customer sử dụng xe
   └─ Rental status: IN_PROGRESS hoặc LATE (nếu quá hạn)

5. RETURN PHASE (Trả xe)
   ├─ Customer bắt đầu trả xe
   ├─ Rental status: RETURNING
   ├─ Staff kiểm tra xe (ảnh + checklist)
   ├─ Hệ thống tính phí phát sinh
   ├─ Rental status: RETURNED
   ├─ Customer thanh toán phí phát sinh (nếu có)
   ├─ Rental status: COMPLETED ✅
   └─ Vehicle status: AVAILABLE ✅
```

---

## 🔐 QUAN TRỌNG: Backend URLs

### Production (ĐANG DEPLOY):

```
Backend API: https://electric-rental-p4ohi.ondigitalocean.app
Frontend: https://electric-vehicle-rental.pages.dev
```

### Local Development:

```
Backend API: http://localhost:5000
Frontend: http://localhost:4200
```

⚠️ **CHÚ Ý**:

- Đã update CORS cho cả 2 domain production
- PayOS webhook CHỈ hoạt động trên production (localhost không nhận được webhook)
- Sử dụng verify-payment API thay vì polling

---

## 📡 API ENDPOINTS - FULL LIST

### 🎫 1. BOOKING APIs

#### 1.1. Tạo Booking

```http
POST /api/bookings
Content-Type: application/json

{
  "renter": "userId",
  "vehicle": "vehicleId",
  "pickupStation": "stationId",
  "pickupDateTime": "2025-11-10T10:00:00Z",
  "returnDateTime": "2025-11-12T10:00:00Z",
  "basePrice": 500000,
  "depositAmount": 200000,
  "totalPayable": 700000
}

Response 201:
{
  "success": true,
  "data": {
    "booking": {
      "_id": "674...",
      "bookingCode": "BK202511060001",
      "status": "PENDING_APPROVAL",
      ...
    }
  }
}
```

#### 1.2. Staff Approve Booking

```http
PUT /api/bookings/{bookingId}/approve
Content-Type: application/json

{
  "staffId": "staffUserId",
  "notes": "Booking approved"
}

Response 200:
{
  "success": true,
  "data": {
    "booking": {
      "status": "APPROVED",
      "statusHistory": [...]
    }
  }
}
```

---

### 💳 2. PAYMENT APIs (PayOS Integration)

#### 2.1. Tạo Payment Link

```http
POST /api/payos/checkout
Content-Type: application/json

{
  "bookingId": "674..."
}

Response 200:
{
  "success": true,
  "data": {
    "bin": "970422",
    "accountNumber": "113366668888",
    "accountName": "NGUYEN VAN A",
    "amount": 700000,
    "description": "Thanh toan booking BK202511060001",
    "orderCode": 1730889000,
    "currency": "VND",
    "paymentLinkId": "abc123...",
    "status": "PENDING",
    "checkoutUrl": "https://pay.payos.vn/web/...",
    "qrCode": "data:image/png;base64,..."
  }
}
```

**Frontend Flow**:

```javascript
// 1. Call checkout API
const response = await fetch("/api/payos/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ bookingId: "xxx" }),
});
const { data } = await response.json();

// 2. Redirect to PayOS
window.location.href = data.checkoutUrl;
// hoặc hiển thị QR code: <img src={data.qrCode} />
```

#### 2.2. Verify Payment (SAU KHI THANH TOÁN)

```http
POST /api/payos/verify-payment
Content-Type: application/json

{
  "orderCode": 1730889000
}

Response 200:
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "paymentStatus": "PAID",
    "bookingStatus": "PAID",
    "booking": {
      "_id": "674...",
      "bookingCode": "BK202511060001",
      "status": "PAID"
    },
    "payment": {
      "_id": "674...",
      "status": "SUCCESS",
      "totalAmount": 700000,
      "paidAt": "2025-11-06T10:30:00Z"
    }
  }
}
```

**Frontend Flow** (PayOS Return Page):

```javascript
// URL: /payos/return?orderCode=1730889000&status=PAID

const urlParams = new URLSearchParams(window.location.search);
const orderCode = urlParams.get("orderCode");
const status = urlParams.get("status");

if (status === "PAID") {
  // Gọi verify API để confirm
  const response = await fetch("/api/payos/verify-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderCode: parseInt(orderCode) }),
  });

  const result = await response.json();

  if (result.success && result.data.bookingStatus === "PAID") {
    // ✅ Thanh toán thành công
    showSuccessMessage("Payment successful!");
    redirectTo(`/bookings/${result.data.booking._id}`);
  }
}
```

⚠️ **QUAN TRỌNG**:

- **KHÔNG DÙNG POLLING** (20 requests / 40 seconds) nữa!
- Chỉ gọi verify-payment API **1 LẦN** sau khi PayOS redirect về
- Backend đã có webhook backup nếu verify-payment miss

---

### 🚗 3. CHECK-IN APIs (Staff)

#### 3.1. Lấy danh sách Rental chờ check-in

```http
GET /api/rentals/ready-for-pickup?stationId={stationId}&date=2025-11-06

Response 200:
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "674...",
      "status": "READY_FOR_PICKUP",
      "renter": {
        "_id": "674...",
        "name": "Nguyen Van A",
        "email": "a@example.com",
        "phone": "0901234567"
      },
      "vehicle": {
        "_id": "674...",
        "licensePlate": "59A-12345",
        "model": "Tesla Model 3",
        "brand": "Tesla",
        "batteryLevel": 95
      },
      "booking": {
        "_id": "674...",
        "bookingCode": "BK202511060001"
      },
      "pickupStation": {
        "_id": "674...",
        "name": "Station Central",
        "address": "123 Main St"
      },
      "plannedPickupTime": "2025-11-10T10:00:00Z"
    }
  ]
}
```

**Frontend UI**:

```jsx
// Staff Dashboard - Check-in List
<div>
  <h2>Rentals Ready for Pickup - {date}</h2>
  <table>
    <thead>
      <tr>
        <th>Booking Code</th>
        <th>Customer</th>
        <th>Vehicle</th>
        <th>Pickup Time</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {rentals.map((rental) => (
        <tr key={rental._id}>
          <td>{rental.booking.bookingCode}</td>
          <td>
            {rental.renter.name}
            <br />
            {rental.renter.phone}
          </td>
          <td>
            {rental.vehicle.licensePlate}
            <br />
            {rental.vehicle.model}
          </td>
          <td>{formatDateTime(rental.plannedPickupTime)}</td>
          <td>
            <button onClick={() => confirmCheckin(rental._id)}>
              ✅ Confirm Check-in
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

#### 3.2. Staff xác nhận check-in

```http
POST /api/rentals/{rentalId}/staff-confirm-checkin
Content-Type: application/json

{
  "staffId": "staffUserId",
  "checkinTime": "2025-11-10T10:05:00Z",
  "notes": "Customer arrived on time, vehicle ready"
}

Response 200:
{
  "success": true,
  "message": "Customer check-in confirmed. Contract ready for signature.",
  "data": {
    "rental": {
      "id": "674...",
      "status": "CHECKED_IN",
      "checkedInAt": "2025-11-10T10:05:00Z",
      "checkedInBy": "staffUserId"
    },
    "booking": {
      "id": "674...",
      "status": "PAID"
    }
  }
}
```

**Frontend Flow**:

```javascript
async function confirmCheckin(rentalId) {
  const confirmed = confirm("Confirm customer check-in?");
  if (!confirmed) return;

  const response = await fetch(
    `/api/rentals/${rentalId}/staff-confirm-checkin`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffId: currentUser.id,
        checkinTime: new Date().toISOString(),
        notes: "Customer checked in",
      }),
    }
  );

  const result = await response.json();

  if (result.success) {
    alert("✅ Check-in confirmed! Send contract to customer.");
    // Redirect to contract signing page
    window.location.href = `/rentals/${rentalId}/contract`;
  }
}
```

---

### 📝 4. CONTRACT SIGNING API (Customer)

#### 4.1. Customer ký hợp đồng điện tử

```http
POST /api/rentals/{rentalId}/customer-sign-contract
Content-Type: application/json

{
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "agreedTerms": true,
  "signedAt": "2025-11-10T10:15:00Z"
}

Response 200:
{
  "success": true,
  "message": "Contract signed successfully. Rental is now in progress.",
  "data": {
    "rental": {
      "id": "674...",
      "status": "IN_PROGRESS",
      "contractSignedAt": "2025-11-10T10:15:00Z",
      "startTime": "2025-11-10T10:15:00Z"
    },
    "booking": {
      "id": "674...",
      "status": "SUCCESS"
    }
  }
}
```

**Frontend UI** (Contract Signing Page):

```jsx
import SignatureCanvas from "react-signature-canvas";

function ContractSigningPage({ rentalId }) {
  const sigCanvas = useRef();
  const [agreed, setAgreed] = useState(false);

  const handleSign = async () => {
    if (!agreed) {
      alert("Please agree to terms and conditions");
      return;
    }

    const signature = sigCanvas.current.toDataURL(); // base64

    const response = await fetch(
      `/api/rentals/${rentalId}/customer-sign-contract`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature: signature,
          agreedTerms: true,
          signedAt: new Date().toISOString(),
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      alert("✅ Contract signed! You can now use the vehicle.");
      window.location.href = `/rentals/${rentalId}/in-progress`;
    }
  };

  return (
    <div>
      <h2>Electronic Contract Signature</h2>

      {/* Contract Terms */}
      <div className="contract-terms">
        <h3>Terms and Conditions</h3>
        <ul>
          <li>Return vehicle on time: {plannedReturnTime}</li>
          <li>Keep vehicle clean and undamaged</li>
          <li>Battery level must be > 20% on return</li>
          <li>Late return fee: 200,000 VND/day</li>
          <li>Cleaning fee if vehicle is dirty: 100,000 VND</li>
          <li>Low battery fee: 150,000 VND</li>
        </ul>
      </div>

      {/* Signature Canvas */}
      <div className="signature-pad">
        <h3>Sign Here</h3>
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: 500,
            height: 200,
            className: "signature-canvas",
          }}
        />
        <button onClick={() => sigCanvas.current.clear()}>Clear</button>
      </div>

      {/* Agreement Checkbox */}
      <label>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        I agree to the terms and conditions
      </label>

      {/* Submit Button */}
      <button onClick={handleSign} disabled={!agreed}>
        ✍️ Sign Contract
      </button>
    </div>
  );
}
```

---

### 🔄 5. RETURN VEHICLE APIs

#### 5.1. Customer bắt đầu trả xe

```http
POST /api/rentals/{rentalId}/customer-initiate-return
Content-Type: application/json

{
  "returnStationId": "stationId", // có thể khác trạm pickup
  "estimatedReturnTime": "2025-11-12T10:00:00Z"
}

Response 200:
{
  "success": true,
  "message": "Return initiated. Please proceed to the station for inspection.",
  "data": {
    "rental": {
      "id": "674...",
      "status": "RETURNING",
      "returnStation": "stationId",
      "estimatedReturnTime": "2025-11-12T10:00:00Z"
    }
  }
}
```

**Frontend UI** (Customer App):

```jsx
function MyActiveRental({ rental }) {
  const handleReturn = async () => {
    const confirmed = confirm("Start return process?");
    if (!confirmed) return;

    const response = await fetch(
      `/api/rentals/${rental._id}/customer-initiate-return`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnStationId: rental.pickupStation._id, // same station
          estimatedReturnTime: new Date().toISOString(),
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      alert("✅ Return initiated. Please go to the station for inspection.");
      window.location.href = `/stations/${rental.pickupStation._id}/directions`;
    }
  };

  return (
    <div className="active-rental-card">
      <h3>Your Active Rental</h3>
      <p>
        Vehicle: {rental.vehicle.licensePlate} - {rental.vehicle.model}
      </p>
      <p>Pickup: {formatDateTime(rental.actualPickupTime)}</p>
      <p>Planned Return: {formatDateTime(rental.plannedReturnTime)}</p>

      {isLate(rental) && (
        <div className="alert-warning">
          ⚠️ Late return! Extra fees apply: 200,000 VND/day
        </div>
      )}

      <button onClick={handleReturn} className="btn-primary">
        🔄 Return Vehicle
      </button>
    </div>
  );
}
```

#### 5.2. Lấy danh sách Rental đang trả (Staff Dashboard)

```http
GET /api/rentals/returning?stationId={stationId}

Response 200:
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "674...",
      "status": "RETURNING",
      "renter": {
        "name": "Nguyen Van A",
        "phone": "0901234567"
      },
      "vehicle": {
        "licensePlate": "59A-12345",
        "model": "Tesla Model 3"
      },
      "booking": {
        "bookingCode": "BK202511060001"
      },
      "returnStation": {
        "name": "Station Central"
      },
      "estimatedReturnTime": "2025-11-12T10:00:00Z"
    }
  ]
}
```

#### 5.3. Staff kiểm tra xe khi trả

```http
POST /api/rentals/{rentalId}/staff-inspect-return
Content-Type: application/json

{
  "staffId": "staffUserId",
  "vehicleCondition": {
    "batteryLevel": 85,
    "mileage": 12650,
    "exteriorPhotos": [
      "https://cloudinary.com/photo1.jpg",
      "https://cloudinary.com/photo2.jpg",
      "https://cloudinary.com/photo3.jpg",
      "https://cloudinary.com/photo4.jpg"
    ],
    "interiorPhotos": [
      "https://cloudinary.com/interior1.jpg",
      "https://cloudinary.com/interior2.jpg"
    ],
    "damages": [
      {
        "type": "scratch",
        "location": "front bumper",
        "severity": "minor",
        "estimatedCost": 500000,
        "photo": "https://cloudinary.com/damage1.jpg"
      }
    ],
    "notes": "Minor scratch on front bumper"
  },
  "checklist": {
    "cleanInterior": true,
    "cleanExterior": true,
    "tireCondition": "good",
    "lightsWorking": true,
    "brakesWorking": true
  },
  "returnTime": "2025-11-12T10:30:00Z"
}

Response 200:
{
  "success": true,
  "message": "Return inspection completed successfully",
  "data": {
    "rental": {
      "id": "674...",
      "status": "RETURNED",
      "returnedAt": "2025-11-12T10:30:00Z",
      "extraCharges": 500000,
      "amountDue": 500000,
      "refundAmount": 0,
      "charges": {
        "lateFee": 0,
        "damageCharges": 500000,
        "cleaningFee": 0,
        "batteryFee": 0,
        "total": 500000
      }
    },
    "vehicle": {
      "id": "674...",
      "status": "maintenance",
      "batteryLevel": 85
    }
  }
}
```

**Frontend UI** (Staff Inspection Page):

```jsx
function VehicleInspectionPage({ rentalId }) {
  const [photos, setPhotos] = useState({
    exterior: [],
    interior: [],
    damages: [],
  });
  const [checklist, setChecklist] = useState({
    cleanInterior: true,
    cleanExterior: true,
    tireCondition: "good",
    lightsWorking: true,
    brakesWorking: true,
  });
  const [damages, setDamages] = useState([]);
  const [batteryLevel, setBatteryLevel] = useState(80);
  const [mileage, setMileage] = useState(0);

  const handlePhotoUpload = async (file, type) => {
    // Upload to Cloudinary or your storage
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const { url } = await response.json();

    setPhotos((prev) => ({
      ...prev,
      [type]: [...prev[type], url],
    }));
  };

  const addDamage = () => {
    setDamages([
      ...damages,
      {
        type: "scratch",
        location: "",
        severity: "minor",
        estimatedCost: 0,
        photo: "",
      },
    ]);
  };

  const submitInspection = async () => {
    const response = await fetch(
      `/api/rentals/${rentalId}/staff-inspect-return`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: currentUser.id,
          vehicleCondition: {
            batteryLevel,
            mileage,
            exteriorPhotos: photos.exterior,
            interiorPhotos: photos.interior,
            damages,
            notes: "",
          },
          checklist,
          returnTime: new Date().toISOString(),
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      if (result.data.rental.amountDue > 0) {
        alert(
          `⚠️ Extra charges: ${result.data.rental.amountDue.toLocaleString()} VND`
        );
        window.location.href = `/rentals/${rentalId}/payment`;
      } else {
        alert("✅ Inspection complete! No extra charges.");
        window.location.href = `/rentals/${rentalId}/finalize`;
      }
    }
  };

  return (
    <div className="inspection-page">
      <h2>Vehicle Return Inspection</h2>

      {/* Basic Info */}
      <div className="section">
        <h3>Vehicle Condition</h3>
        <label>
          Battery Level (%):
          <input
            type="number"
            value={batteryLevel}
            onChange={(e) => setBatteryLevel(e.target.value)}
          />
        </label>
        <label>
          Mileage (km):
          <input
            type="number"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
          />
        </label>
      </div>

      {/* Photo Upload */}
      <div className="section">
        <h3>Exterior Photos (4 angles)</h3>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handlePhotoUpload(e.target.files[0], "exterior")}
        />
        <div className="photo-grid">
          {photos.exterior.map((url, i) => (
            <img key={i} src={url} alt={`Exterior ${i + 1}`} />
          ))}
        </div>
      </div>

      <div className="section">
        <h3>Interior Photos</h3>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handlePhotoUpload(e.target.files[0], "interior")}
        />
        <div className="photo-grid">
          {photos.interior.map((url, i) => (
            <img key={i} src={url} alt={`Interior ${i + 1}`} />
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div className="section">
        <h3>Inspection Checklist</h3>
        <label>
          <input
            type="checkbox"
            checked={checklist.cleanInterior}
            onChange={(e) =>
              setChecklist({ ...checklist, cleanInterior: e.target.checked })
            }
          />
          Clean Interior
        </label>
        <label>
          <input
            type="checkbox"
            checked={checklist.cleanExterior}
            onChange={(e) =>
              setChecklist({ ...checklist, cleanExterior: e.target.checked })
            }
          />
          Clean Exterior
        </label>
        <label>
          <input
            type="checkbox"
            checked={checklist.lightsWorking}
            onChange={(e) =>
              setChecklist({ ...checklist, lightsWorking: e.target.checked })
            }
          />
          Lights Working
        </label>
        <label>
          <input
            type="checkbox"
            checked={checklist.brakesWorking}
            onChange={(e) =>
              setChecklist({ ...checklist, brakesWorking: e.target.checked })
            }
          />
          Brakes Working
        </label>
      </div>

      {/* Damages */}
      <div className="section">
        <h3>Damages</h3>
        <button onClick={addDamage}>+ Add Damage</button>
        {damages.map((damage, index) => (
          <div key={index} className="damage-form">
            <select
              value={damage.type}
              onChange={(e) => {
                const newDamages = [...damages];
                newDamages[index].type = e.target.value;
                setDamages(newDamages);
              }}
            >
              <option value="scratch">Scratch</option>
              <option value="dent">Dent</option>
              <option value="broken">Broken</option>
              <option value="missing">Missing</option>
              <option value="stain">Stain</option>
            </select>
            <input
              type="text"
              placeholder="Location"
              value={damage.location}
              onChange={(e) => {
                const newDamages = [...damages];
                newDamages[index].location = e.target.value;
                setDamages(newDamages);
              }}
            />
            <select
              value={damage.severity}
              onChange={(e) => {
                const newDamages = [...damages];
                newDamages[index].severity = e.target.value;
                setDamages(newDamages);
              }}
            >
              <option value="minor">Minor</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
            <input
              type="number"
              placeholder="Cost (VND)"
              value={damage.estimatedCost}
              onChange={(e) => {
                const newDamages = [...damages];
                newDamages[index].estimatedCost = parseInt(e.target.value);
                setDamages(newDamages);
              }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const url = await handlePhotoUpload(
                  e.target.files[0],
                  "damages"
                );
                const newDamages = [...damages];
                newDamages[index].photo = url;
                setDamages(newDamages);
              }}
            />
          </div>
        ))}
      </div>

      {/* Submit */}
      <button onClick={submitInspection} className="btn-primary">
        ✅ Complete Inspection
      </button>
    </div>
  );
}
```

#### 5.4. Hoàn tất trả xe (Thanh toán phí phát sinh)

```http
POST /api/rentals/{rentalId}/finalize-return
Content-Type: application/json

{
  "paymentMethod": "cash",
  "paidAmount": 500000,
  "staffId": "staffUserId"
}

Response 200:
{
  "success": true,
  "message": "Return finalized successfully",
  "data": {
    "rental": {
      "id": "674...",
      "status": "COMPLETED",
      "completedAt": "2025-11-12T11:00:00Z",
      "extraCharges": 500000,
      "paidAmount": 1200000,
      "refundAmount": 0
    }
  }
}
```

---

## 🎨 FRONTEND SCREENS CHECKLIST

### ✅ Customer Screens:

- [ ] **Booking Page**: Chọn xe, station, thời gian
- [ ] **Payment Page**: Hiển thị QR PayOS hoặc redirect
- [ ] **Payment Return Page**: `/payos/return` - verify payment
- [ ] **Contract Signing Page**: Canvas chữ ký + terms checkbox
- [ ] **My Active Rental Page**: Hiển thị rental đang sử dụng
- [ ] **Return Initiate Page**: Nút "Return Vehicle"
- [ ] **Receipt Page**: Xem chi tiết phí, refund

### ✅ Staff Screens:

- [ ] **Booking Approval Dashboard**: Approve/Reject bookings
- [ ] **Check-in List**: Danh sách rental chờ check-in
- [ ] **Check-in Confirmation Page**: Nút confirm check-in
- [ ] **Return Inspection Page**: Upload ảnh, checklist, damages
- [ ] **Payment Collection Page**: Nhận tiền phí phát sinh

---

## 💰 FEE CALCULATION (Hard-coded trong Backend)

```javascript
// Backend tự động tính các phí này:

1. Late Fee (Phí trễ hạn):
   - 200,000 VND/ngày trễ
   - Tính từ plannedReturnTime đến actualReturnTime

2. Damage Charges (Phí hư hỏng):
   - Theo estimatedCost của mỗi damage
   - Staff nhập khi inspection

3. Cleaning Fee (Phí vệ sinh):
   - 100,000 VND nếu cleanInterior = false hoặc cleanExterior = false

4. Low Battery Fee (Phí pin thấp):
   - 150,000 VND nếu batteryLevel < 20%

Total Extra Charges = Late Fee + Damage Charges + Cleaning Fee + Battery Fee
Amount Due = Total Extra Charges
Refund Amount = Deposit - Amount Due (nếu âm thì = 0)
```

**Frontend Display**:

```jsx
function PaymentSummary({ rental }) {
  return (
    <div className="payment-summary">
      <h3>Payment Summary</h3>

      <div className="line-item">
        <span>Base Rental</span>
        <span>{rental.baseAmount.toLocaleString()} VND</span>
      </div>

      <div className="line-item">
        <span>Deposit Paid</span>
        <span>{rental.depositAmount.toLocaleString()} VND</span>
      </div>

      <hr />

      <h4>Extra Charges</h4>

      {rental.lateFeeAmount > 0 && (
        <div className="line-item text-danger">
          <span>Late Fee ({rental.lateDays} days)</span>
          <span>+{rental.lateFeeAmount.toLocaleString()} VND</span>
        </div>
      )}

      {rental.damageCharges > 0 && (
        <div className="line-item text-danger">
          <span>Damage Charges</span>
          <span>+{rental.damageCharges.toLocaleString()} VND</span>
        </div>
      )}

      {rental.cleaningFee > 0 && (
        <div className="line-item text-danger">
          <span>Cleaning Fee</span>
          <span>+{rental.cleaningFee.toLocaleString()} VND</span>
        </div>
      )}

      {rental.batteryFee > 0 && (
        <div className="line-item text-danger">
          <span>Low Battery Fee</span>
          <span>+{rental.batteryFee.toLocaleString()} VND</span>
        </div>
      )}

      <hr />

      <div className="line-item total">
        <span>
          <strong>Amount Due</strong>
        </span>
        <span>
          <strong>{rental.amountDue.toLocaleString()} VND</strong>
        </span>
      </div>

      {rental.refundAmount > 0 && (
        <div className="line-item text-success">
          <span>Deposit Refund</span>
          <span>{rental.refundAmount.toLocaleString()} VND</span>
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 STATUS FLOW DIAGRAM

```
BOOKING_STATUS:
CREATED → PENDING_APPROVAL → APPROVED → WAITING_PAYMENT → PAID → SUCCESS

RENTAL_STATUS:
CREATED → READY_FOR_PICKUP → CHECKED_IN → IN_PROGRESS → RETURNING → RETURNED → COMPLETED
                                                ↓
                                              LATE (nếu quá hạn)
                                                ↓
                                            RETURNING → RETURNED → COMPLETED

                                            (nếu có hư hỏng nghiêm trọng)
                                            RETURNING → DAMAGED → (cần sửa chữa)

VEHICLE_STATUS:
available → reserved → rented → available
                          ↓
                      maintenance (nếu có hư hỏng nhẹ)
                          ↓
                      damaged (nếu hư hỏng nghiêm trọng)
```

---

## 🚨 ERROR HANDLING

### Payment Failed

```javascript
// PayOS return với status = CANCELLED
if (urlParams.get("status") === "CANCELLED") {
  alert("❌ Payment cancelled by user");
  window.location.href = "/bookings";
}
```

### Rental Not Ready for Check-in

```javascript
// Response 400
{
  "message": "Rental must be in READY_FOR_PICKUP status, currently: IN_PROGRESS"
}
```

### Extra Charges Not Paid

```javascript
// Response 400
{
  "message": "Additional charges not paid. Amount due: 500,000 VND",
  "amountDue": 500000
}
```

---

## 🎯 TESTING CHECKLIST

### ✅ E2E Flow Test:

1. [ ] Create booking → Approve → Payment (PayOS) → Verify → Booking PAID
2. [ ] Wait 5 minutes → BGJ tạo Rental READY_FOR_PICKUP
3. [ ] Staff confirm check-in → Rental CHECKED_IN
4. [ ] Customer sign contract → Rental IN_PROGRESS, Booking SUCCESS
5. [ ] Customer initiate return → Rental RETURNING
6. [ ] Staff inspect return (with damages) → Rental RETURNED, extra charges calculated
7. [ ] Staff finalize payment → Rental COMPLETED, Vehicle AVAILABLE

### ✅ Edge Cases:

- [ ] Late return (quá plannedReturnTime)
- [ ] Low battery return (< 20%)
- [ ] Dirty vehicle return
- [ ] Severe damage (vehicle → DAMAGED)
- [ ] Payment timeout (booking → CANCELLED)

---

## 📞 SUPPORT

Backend Team Contact:

- API Documentation: `http://localhost:5000/docs` (Swagger)
- Production API: `https://electric-rental-p4ohi.ondigitalocean.app`

Notes:

- Tất cả datetime sử dụng ISO 8601 format: `2025-11-06T10:00:00Z`
- Tất cả amount sử dụng VND (integer)
- File upload (photos) cần integrate với Cloudinary hoặc storage service
- Signature canvas: sử dụng library như `react-signature-canvas`

---

🎉 **GOOD LUCK WITH FRONTEND IMPLEMENTATION!** 🚀
