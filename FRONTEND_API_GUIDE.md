# 📋 HƯỚNG DẪN API CHO FRONTEND - EV RENTAL SYSTEM

## ⚠️ VẤN ĐỀ HIỆN TẠI

**Backend đã reset database và reseed với ObjectId mới!**

- ✅ Database có sẵn **50 vehicles** và **10 brands**
- ❌ Frontend đang cache/lưu **ObjectId cũ** → Gọi API bị lỗi validation
- 🔄 **BẮT BUỘC**: Frontend phải refetch lại tất cả Brand và Vehicle IDs

---

## 🚀 API CƠ BẢN

### Base URL
- **Local**: `http://localhost:5000`
- **Production**: `https://electric-rental-p4ohi.ondigitalocean.app`

---

## 📦 API LẤY DANH SÁCH XE

### 1. **Lấy tất cả xe** (Recommended)
```http
GET /api/vehicles
```

**Response:**
```json
{
  "data": [
    {
      "_id": "6908d0bc0222ed11d2901d86",
      "vin": "EVR-2024-0001",
      "plateNo": "51H-123.45",
      "model": "Tesla Model 3",
      "status": "available",
      "batteryPercent": 85,
      "odometer": 12450,
      "brand": {
        "_id": "6908d0bc0222ed11d2901d7c",
        "code": "TESLA-M3",
        "name": "Tesla Model 3",
        "baseDailyRate": 1450000,
        "depositAmount": 5000000,
        "imageUrl": "https://...",
        "specs": {
          "seats": 5,
          "range": 580,
          "horsePower": 283
        }
      },
      "stationId": {
        "_id": "6908d0bb0222ed11d2901d78",
        "code": "HCM-01",
        "name": "Trạm Quận 1"
      }
    }
  ]
}
```

---

### 2. **Lấy xe theo station** (Filter by stationId)
```http
GET /api/vehicles?stationId=6908d0bb0222ed11d2901d78
```

**Query Parameters:**
- `stationId` (optional): MongoDB ObjectId của station
- `brandId` (optional): MongoDB ObjectId của brand

**Use case:** Hiển thị xe tại 1 trạm cụ thể

---

### 3. **Lấy xe theo brand**
```http
GET /api/vehicles?brandId=6908d0bc0222ed11d2901d7c
```

**Use case:** Lọc xe theo loại (Tesla, VinFast, v.v.)

---

### 4. **Lấy chi tiết 1 xe**
```http
GET /api/vehicles/:id
```

**Example:**
```http
GET /api/vehicles/6908d0bc0222ed11d2901d86
```

**Response:**
```json
{
  "data": {
    "_id": "6908d0bc0222ed11d2901d86",
    "vin": "EVR-2024-0001",
    "plateNo": "51H-123.45",
    "model": "Tesla Model 3",
    "status": "available",
    "brand": { /* populated brand object */ },
    "stationId": { /* populated station object */ }
  }
}
```

---

## 🏷️ API BRAND (LOẠI XE)

### 1. **Lấy tất cả brands**
```http
GET /api/brands
```

**Response:**
```json
{
  "data": [
    {
      "_id": "6908d0bc0222ed11d2901d7c",
      "code": "TESLA-M3",
      "name": "Tesla Model 3",
      "description": "Compact premium EV sedan...",
      "baseDailyRate": 1450000,
      "depositAmount": 5000000,
      "imageUrl": "https://...",
      "images": ["url1", "url2", "url3"],
      "specs": {
        "seats": 5,
        "range": 580,
        "horsePower": 283,
        "batteryCapacity": 60,
        "transmission": "single-speed",
        "fuelType": "electric",
        "carType": "sedan"
      },
      "features": ["Autopilot", "Sạc nhanh", "Camera 360"],
      "isActive": true
    }
  ]
}
```

---

### 2. **Lấy brands theo station** (WITH AVAILABILITY)
```http
GET /api/brands/by-station?stationId=6908d0bb0222ed11d2901d78
```

**⭐ RECOMMENDED cho trang chọn xe!**

**Response:**
```json
{
  "data": [
    {
      "brand": {
        "_id": "6908d0bc0222ed11d2901d7c",
        "code": "TESLA-M3",
        "name": "Tesla Model 3",
        "baseDailyRate": 1450000,
        "specs": { /* ... */ }
      },
      "availableVehicleCount": 5,
      "isAvailable": true
    }
  ]
}
```

**Use case:**
- Hiển thị danh sách loại xe có sẵn tại trạm
- Hiển thị số lượng xe còn trống
- Chỉ hiển thị brand có xe available

---

### 3. **Đếm số xe của 1 brand**
```http
GET /api/brands/:id/vehicles/count
```

**Example:**
```http
GET /api/brands/6908d0bc0222ed11d2901d7c/vehicles/count
```

**Response:**
```json
{
  "data": {
    "brand": {
      "_id": "6908d0bc0222ed11d2901d7c",
      "code": "TESLA-M3",
      "name": "Tesla Model 3"
    },
    "totalVehicles": 12,
    "availableVehicles": 8,
    "unavailableVehicles": 4
  }
}
```

---

## 🏪 API STATION (TRẠM XE)

### Lấy tất cả stations
```http
GET /api/stations
```

**Response:**
```json
{
  "data": [
    {
      "_id": "6908d0bb0222ed11d2901d78",
      "code": "HCM-01",
      "name": "Trạm Quận 1",
      "address": "123 Nguyễn Huệ, Q.1, TP.HCM",
      "city": "Ho Chi Minh",
      "contactPhone": "+84 28 1234 5678",
      "operatingHours": {
        "open": "06:00",
        "close": "22:00"
      },
      "location": {
        "type": "Point",
        "coordinates": [106.7008, 10.7756]
      }
    }
  ]
}
```

---

## 📝 API BOOKING (TẠO ĐẶT XE)

### Tạo booking mới
```http
POST /api/bookings
```

**Request Body:**
```json
{
  "user": "6908d0bb0222ed11d2901d74",
  "brand": "6908d0bc0222ed11d2901d7c",
  "vehicle": "6908d0bc0222ed11d2901d86",
  "pickupStationId": "6908d0bb0222ed11d2901d78",
  "returnStationId": "6908d0bb0222ed11d2901d78",
  "startDate": "2025-11-05T08:00:00.000Z",
  "endDate": "2025-11-07T18:00:00.000Z"
}
```

**⚠️ LƯU Ý:**
- **PHẢI dùng ObjectId mới** từ database đã reseed
- Nếu dùng ObjectId cũ → Lỗi: "Brand không tồn tại" hoặc "Vehicle không tồn tại"

---

## 🔧 CÁCH SỬA LỖI CHO FRONTEND

### Vấn đề: "Brand không tồn tại" / "Vehicle không tồn tại"

**Nguyên nhân:**
- Backend đã reset database → ObjectId mới
- Frontend cache ObjectId cũ

**Giải pháp:**

#### Bước 1: Clear cache/localStorage
```javascript
// Clear tất cả cache liên quan đến brands, vehicles
localStorage.removeItem('brands');
localStorage.removeItem('vehicles');
sessionStorage.clear();
```

#### Bước 2: Refetch brands
```javascript
const fetchBrands = async (stationId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/brands/by-station?stationId=${stationId}`
  );
  const { data } = await response.json();
  return data;
};
```

#### Bước 3: Refetch vehicles
```javascript
const fetchVehicles = async (stationId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/vehicles?stationId=${stationId}`
  );
  const { data } = await response.json();
  return data;
};
```

#### Bước 4: Sử dụng ObjectId mới khi tạo booking
```javascript
const createBooking = async (bookingData) => {
  const response = await fetch(`${API_BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: currentUser._id,
      brand: selectedBrand._id,        // ← Lấy từ API, KHÔNG hardcode
      vehicle: selectedVehicle._id,    // ← Lấy từ API, KHÔNG hardcode
      pickupStationId: stationId,
      returnStationId: stationId,
      startDate: startDate,
      endDate: endDate
    })
  });
  return response.json();
};
```

---

## 📊 THỐNG KÊ DATABASE HIỆN TẠI

```
✅ Total vehicles: 50
✅ Total brands: 10
✅ Total stations: 4
✅ Total users: 5
```

**Stations có sẵn:**
- HCM-01: Trạm Quận 1 (14 xe)
- HCM-02: Trạm Tân Bình (12 xe)
- HN-01: Trạm Hoàn Kiếm (13 xe)
- DN-01: Trạm Hải Châu (11 xe)

**Brands có sẵn:**
- TESLA-M3: Tesla Model 3
- TESLA-MY: Tesla Model Y
- VINFAST-VF8: VinFast VF 8
- VINFAST-VF-E34: VinFast VF e34
- VINFAST-VF3: VinFast VF 3
- NISSAN-LEAF: Nissan Leaf
- HYUNDAI-KONA: Hyundai Kona Electric
- KIA-EV6: Kia EV6
- BYD-ATTO3: BYD Atto 3
- MG-ZS-EV: MG ZS EV

---

## 🎯 CHECKLIST CHO FRONTEND AGENT

### Kiểm tra ngay:

- [ ] **API `/api/vehicles` trả về 50 xe?**
  - Nếu không → Backend chưa seed hoặc production chưa reset DB

- [ ] **API `/api/brands/by-station?stationId=...` có data?**
  - Nếu không → StationId sai hoặc chưa có xe tại station đó

- [ ] **Frontend đang dùng ObjectId cũ?**
  - Check localStorage/sessionStorage
  - Check hardcoded IDs trong code

- [ ] **Khi tạo booking, có log ObjectId đang gửi?**
  ```javascript
  console.log('Creating booking with:', {
    brandId: selectedBrand._id,
    vehicleId: selectedVehicle._id
  });
  ```

- [ ] **Response lỗi từ backend là gì?**
  - "Brand không tồn tại" → brandId sai
  - "Vehicle không tồn tại" → vehicleId sai
  - "Duplicate bookingCode" → Backend issue (đã fix)

---

## 🔗 SWAGGER DOCUMENTATION

Xem đầy đủ API documentation tại:
```
http://localhost:5000/api-docs
```

---

## 💡 TIPS

1. **KHÔNG hardcode ObjectId** - Luôn fetch từ API
2. **Cache với TTL** - Set expiry cho cache (VD: 1 giờ)
3. **Validate trước khi submit** - Check ObjectId format và existence
4. **Handle errors gracefully** - Hiển thị message rõ ràng cho user
5. **Test với production URL** - Đảm bảo production DB đã được reset

---

## 🆘 SUPPORT

Nếu vẫn gặp lỗi:
1. Check browser console log
2. Check network tab → request/response
3. Verify ObjectId format (24 hex characters)
4. Confirm API endpoint đang gọi đúng chưa
5. Check xem production backend đã reset DB chưa

**Backend Status:**
- ✅ Local: Database đã reset và reseed thành công
- ⏳ Production: Cần chạy `npm run reseed:prod` trên DigitalOcean Console
