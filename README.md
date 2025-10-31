# 🚗 EV Rental System - Backend API

> **Hệ thống quản lý thuê xe điện** - API hoàn chỉnh và sẵn sàng cho Frontend Integration

[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)](https://github.com)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com)
[![Database](https://img.shields.io/badge/database-50%20vehicles-orange)](https://github.com)
[![Brands](https://img.shields.io/badge/brands-10%20EV%20models-yellow)](https://github.com)

---

## 📋 Mục lục

- [🎯 Tổng quan](#-tổng-quan)
- [✨ Tính năng mới nhất](#-tính-năng-mới-nhất)
- [📊 Dữ liệu hiện có](#-dữ-liệu-hiện-có)
- [🚀 Cài đặt và Chạy](#-cài-đặt-và-chạy)
- [🔧 Cấu hình](#-cấu-hình)
- [🔐 Authentication](#-authentication)
- [📡 API Endpoints](#-api-endpoints)
- [🎨 Frontend Integration Guide](#-frontend-integration-guide)
- [📦 Data Models](#-data-models)
- [⚠️ Error Handling](#️-error-handling)
- [📤 Upload Files](#-upload-files)
- [🧪 Testing](#-testing)

---

## 🎯 Tổng quan

Backend API cho hệ thống quản lý thuê xe điện với **50 xe điện** từ **10 hãng** phân bố tại **4 trạm** tại Việt Nam.

### 💻 Tech Stack

- **Node.js** v20+ & **Express.js** v5.1.0
- **MongoDB** với **Mongoose** v8.19.0
- **JWT** (jsonwebtoken v9.0.2) - Authentication
- **Multer** v2.0.2 - File upload
- **Swagger** - API documentation
- **Bcrypt** v5.1.1 - Password hashing

### 🌐 URLs

- **Base URL**: `http://localhost:4000`
- **API Prefix**: `/api`
- **Swagger Docs**: `http://localhost:4000/docs`

---

## ✨ Tính năng mới nhất

### 🆕 Brand by Station API

**Endpoint**: `GET /api/brands/by-station?stationId=<id>`

API mới trả về danh sách brands với **availability status** và **vehicle specifications** đầy đủ theo từng trạm.

**Highlights**:

- ✅ **Availability Status**: `available`, `out_of_stock`, `no_vehicles`
- ✅ **Complete Specs**: seats, range, horsePower, transmission, carType, trunkCapacity, airbags, wheelSize, screenSize, dailyKmLimit
- ✅ **Multiple Images**: Array 4 ảnh cho carousel
- ✅ **Real-time Count**: Total, available, rented, maintenance vehicles

**Example Response**:

```json
{
  "data": [
    {
      "_id": "...",
      "code": "VINFAST-VF3",
      "name": "VinFast VF 3",
      "description": "Compact city EV ideal for short urban trips.",
      "baseDailyRate": 590000,
      "depositAmount": 2000000,
      "imageUrl": "https://...",
      "images": [
        "https://vinfastauto.com/.../vf3-1.jpg",
        "https://vinfastauto.com/.../vf3-2.jpg",
        "https://vinfastauto.com/.../vf3-3.jpg",
        "https://vinfastauto.com/.../vf3-4.jpg"
      ],
      "specs": {
        "seats": 4,
        "range": 210,
        "horsePower": 43,
        "batteryCapacity": 18.64,
        "transmission": "single-speed",
        "fuelType": "electric",
        "carType": "minicar",
        "trunkCapacity": 285,
        "airbags": 1,
        "wheelSize": 16,
        "screenSize": 10,
        "dailyKmLimit": 300
      },
      "manufacturer": {
        "country": "Vietnam",
        "website": "https://www.vinfastauto.com"
      },
      "features": [
        "Gọn nhẹ",
        "Đỗ xe dễ dàng",
        "Màn hình LCD 10 inch",
        "Kết nối Bluetooth",
        "La-zăng 16 inch"
      ],
      "isActive": true,
      "availability": {
        "status": "available",
        "total": 3,
        "available": 3,
        "rented": 0,
        "maintenance": 0
      }
    }
  ],
  "stationId": "station-hcm-01"
}
```

---

## 📊 Dữ liệu hiện có

### 🚗 10 Brands (Hãng xe điện)

| Brand Code         | Tên                   | Loại xe   | Giá/ngày   | Chỗ | Range | Cốp  | Túi khí | Màn hình | La-zăng |
| ------------------ | --------------------- | --------- | ---------- | --- | ----- | ---- | ------- | -------- | ------- |
| **TESLA-M3**       | Tesla Model 3         | Sedan     | 1,450,000đ | 5   | 580km | 425L | 8       | 15"      | 19"     |
| **TESLA-MY**       | Tesla Model Y         | SUV       | 1,650,000đ | 7   | 525km | 854L | 8       | 15"      | 20"     |
| **NISSAN-LEAF**    | Nissan Leaf           | Hatchback | 950,000đ   | 5   | 385km | 405L | 6       | 8"       | 17"     |
| **VINFAST-VF-E34** | VinFast VF e34        | Crossover | 870,000đ   | 5   | 285km | 382L | 2       | 10"      | 17"     |
| **VINFAST-VF3**    | VinFast VF 3          | Minicar   | 590,000đ   | 4   | 210km | 285L | 1       | 10"      | 16"     |
| **VINFAST-VF8**    | VinFast VF 8          | SUV       | 1,350,000đ | 5   | 420km | 376L | 11      | 15.6"    | 20"     |
| **HYUNDAI-KONA**   | Hyundai Kona Electric | SUV       | 1,150,000đ | 5   | 484km | 332L | 6       | 10.25"   | 17"     |
| **KIA-EV6**        | Kia EV6               | Crossover | 1,280,000đ | 5   | 528km | 490L | 7       | 12.3"    | 19"     |
| **BYD-ATTO3**      | BYD Atto 3            | SUV       | 1,050,000đ | 5   | 420km | 440L | 7       | 12.8"    | 18"     |
| **MG-ZS-EV**       | MG ZS EV              | SUV       | 890,000đ   | 5   | 320km | 448L | 6       | 8"       | 17"     |

**Specs đầy đủ cho mỗi brand**:

- ✅ Số chỗ ngồi (seats)
- ✅ Quãng đường (range km)
- ✅ Công suất (horsePower)
- ✅ Dung lượng pin (batteryCapacity kWh)
- ✅ Hộp số (transmission)
- ✅ Loại xe (carType)
- ✅ Dung tích cốp (trunkCapacity lít)
- ✅ Số túi khí (airbags)
- ✅ Kích thước la-zăng (wheelSize inch)
- ✅ Kích thước màn hình (screenSize inch)
- ✅ Giới hạn km/ngày (dailyKmLimit)

### 🏢 4 Stations (Trạm thuê xe)

| Station ID         | Tên                       | Địa chỉ                     | Thành phố | Số xe | Latitude | Longitude |
| ------------------ | ------------------------- | --------------------------- | --------- | ----- | -------- | --------- |
| **station-hcm-01** | Ho Chi Minh EV Hub        | 123 Nguyễn Huệ, Q.1         | TP.HCM    | 14    | 10.7769  | 106.7009  |
| **station-hcm-02** | Saigon Riverfront Station | 456 Tôn Đức Thắng, Q.1      | TP.HCM    | 12    | 10.7721  | 106.7056  |
| **station-hn-01**  | Hanoi Old Quarter Station | 789 Hàng Bài, Hoàn Kiếm     | Hà Nội    | 13    | 21.0285  | 105.8542  |
| **station-dn-01**  | Da Nang Beach Station     | 101 Võ Nguyên Giáp, Sơn Trà | Đà Nẵng   | 11    | 16.0544  | 108.2440  |

### 🚙 50 Vehicles (Xe điện)

**Tổng quan**:

- **Available**: 31 xe (62%)
- **Rented**: 10 xe (20%)
- **Maintenance**: 9 xe (18%)

**Phân bố theo trạm**:

#### 🏢 HCM-01 (14 xe)

- Tesla Model 3: 2 xe (1 available, 1 rented)
- Tesla Model Y: 1 xe (rented)
- Nissan Leaf: 1 xe (available)
- VinFast VF 3: 2 xe (all available)
- VinFast VF e34: 1 xe (available)
- VinFast VF 8: 1 xe (available)
- Hyundai Kona: 1 xe (maintenance)
- Kia EV6: 1 xe (rented)
- BYD Atto 3: 2 xe (all available)
- MG ZS EV: 2 xe (1 available, 1 maintenance)

#### 🏢 HCM-02 (12 xe)

- Tesla Model 3: 2 xe (1 available, 1 maintenance)
- Tesla Model Y: 1 xe (available)
- Nissan Leaf: 2 xe (1 available, 1 maintenance)
- VinFast VF 3: 1 xe (available)
- VinFast VF e34: 1 xe (available)
- VinFast VF 8: 1 xe (rented)
- Hyundai Kona: 1 xe (rented)
- Kia EV6: 1 xe (maintenance)
- BYD Atto 3: 1 xe (available)
- MG ZS EV: 1 xe (available)

#### 🏢 HN-01 (13 xe)

- Tesla Model 3: 1 xe (available)
- Tesla Model Y: 1 xe (available)
- Nissan Leaf: 1 xe (available)
- VinFast VF 3: 2 xe (all available)
- VinFast VF e34: 1 xe (rented)
- VinFast VF 8: 1 xe (maintenance)
- Hyundai Kona: 2 xe (1 available, 1 rented)
- Kia EV6: 1 xe (available)
- BYD Atto 3: 2 xe (all available)
- MG ZS EV: 1 xe (available)

#### 🏢 DN-01 (11 xe)

- Tesla Model 3: 1 xe (available)
- Tesla Model Y: 1 xe (available)
- Nissan Leaf: 1 xe (available)
- VinFast VF 3: 1 xe (available)
- VinFast VF e34: 1 xe (available)
- VinFast VF 8: 1 xe (maintenance)
- Hyundai Kona: 2 xe (all available)
- Kia EV6: 1 xe (rented)
- BYD Atto 3: 1 xe (available)
- MG ZS EV: 1 xe (available)

---

## 🚀 Cài đặt và Chạy

### 1️⃣ Clone repository

```bash
git clone https://github.com/AbandonedDemon/ev-rental-system-backend.git
cd ev-rental-system-backend
```

### 2️⃣ Cài đặt dependencies

```bash
npm install
```

### 3️⃣ Cấu hình environment variables

Tạo file `.env` trong thư mục gốc:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/ev-rental-system
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### 4️⃣ Seed database (Tạo dữ liệu mẫu)

```bash
npm run seed
```

**Output**:

```
🌱 Starting database seeding...
MongoDB connected successfully
✅ Connected to MongoDB
User seed complete. Total users: 5
Station seed complete. Total stations: 4
Brand seed complete. Total brands: 10
Vehicle seed complete. Total vehicles: 50
Booking seed complete. Total bookings: 5
User documents seed complete. Total documents: 3
Rental seed complete. Total rentals: 3
Handover seed complete. Total handovers: 5
Payment seed complete. Total payments: 3
✅ Database seeding completed successfully!
```

### 5️⃣ Chạy server

```bash
# Development mode (với nodemon)
npm run dev

# Production mode
npm start
```

### 6️⃣ Truy cập Swagger Documentation

Mở trình duyệt: **http://localhost:4000/docs**

---

## 🔧 Cấu hình

### Environment Variables

| Variable         | Mô tả                     | Giá trị mặc định | Bắt buộc |
| ---------------- | ------------------------- | ---------------- | -------- |
| `PORT`           | Port chạy server          | 4000             | ❌       |
| `MONGODB_URI`    | MongoDB connection string | -                | ✅       |
| `JWT_SECRET`     | Secret key cho JWT token  | -                | ✅       |
| `JWT_EXPIRES_IN` | Thời gian hết hạn JWT     | 7d               | ❌       |

### Scripts

```json
{
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "seed": "node src/scripts/seed.js"
}
```

---

## 🔐 Authentication

### JWT Token

API sử dụng **JWT (JSON Web Token)** cho authentication.

**Login để nhận token**:

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response**:

```json
{
  "user": {
    "_id": "...",
    "email": "admin@example.com",
    "fullName": "Admin User",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Sử dụng token trong request**:

```bash
GET /api/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Roles

- **admin**: Quản trị hệ thống
- **staff**: Nhân viên trạm
- **customer**: Khách hàng thuê xe

### Test Accounts

| Email                 | Password    | Role     |
| --------------------- | ----------- | -------- |
| admin@example.com     | admin123    | admin    |
| staff@example.com     | staff123    | staff    |
| customer1@example.com | customer123 | customer |

---

## 📡 API Endpoints

### 1️⃣ Auth APIs

#### 🔐 Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response**:

```json
{
  "user": {
    "_id": "...",
    "email": "admin@example.com",
    "fullName": "Admin User",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 📝 Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "fullName": "New User",
  "phoneNumber": "0901234567"
}
```

---

### 2️⃣ User APIs

#### 👤 Get Current User

```http
GET /api/users/me
Authorization: Bearer <token>
```

#### 📋 List Users (Admin only)

```http
GET /api/users
Authorization: Bearer <admin-token>
```

#### 🔄 Update Profile

```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Updated Name",
  "phoneNumber": "0909999999"
}
```

---

### 3️⃣ Brand APIs

#### 📋 List All Brands

```http
GET /api/brands
```

**Response**:

```json
[
  {
    "_id": "...",
    "code": "TESLA-M3",
    "name": "Tesla Model 3",
    "baseDailyRate": 1450000,
    "specs": {
      "seats": 5,
      "range": 580,
      "horsePower": 283,
      "carType": "sedan",
      "trunkCapacity": 425,
      "airbags": 8,
      "wheelSize": 19,
      "screenSize": 15,
      "dailyKmLimit": 500
    },
    "images": ["url1", "url2", "url3", "url4"]
  }
]
```

#### 🏢 Get Brands by Station ⭐ NEW

```http
GET /api/brands/by-station?stationId=station-hcm-01
```

**Query Parameters**:

- `stationId` (required): ID của trạm

**Response**:

```json
{
  "data": [
    {
      "_id": "...",
      "code": "VINFAST-VF3",
      "name": "VinFast VF 3",
      "baseDailyRate": 590000,
      "depositAmount": 2000000,
      "imageUrl": "https://...",
      "images": ["url1", "url2", "url3", "url4"],
      "specs": {
        "seats": 4,
        "range": 210,
        "horsePower": 43,
        "transmission": "single-speed",
        "carType": "minicar",
        "trunkCapacity": 285,
        "airbags": 1,
        "wheelSize": 16,
        "screenSize": 10,
        "dailyKmLimit": 300
      },
      "availability": {
        "status": "available",
        "total": 3,
        "available": 3,
        "rented": 0,
        "maintenance": 0
      }
    }
  ],
  "stationId": "station-hcm-01"
}
```

**Availability Status**:

- `available`: Có xe sẵn sàng
- `out_of_stock`: Hết xe (tất cả đang thuê hoặc bảo trì)
- `no_vehicles`: Không có xe của brand này tại trạm

#### 🔍 Get Brand Detail

```http
GET /api/brands/:brandId
```

#### ➕ Create Brand (Admin only)

```http
POST /api/brands
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "code": "NEW-BRAND",
  "name": "New EV Brand",
  "baseDailyRate": 1000000,
  "specs": {
    "seats": 5,
    "range": 400,
    "horsePower": 200
  }
}
```

#### ✏️ Update Brand (Admin only)

```http
PUT /api/brands/:brandId
Authorization: Bearer <admin-token>
```

#### 🗑️ Delete Brand (Admin only)

```http
DELETE /api/brands/:brandId
Authorization: Bearer <admin-token>
```

---

### 4️⃣ Vehicle APIs

#### 📋 List Vehicles

```http
GET /api/vehicles
```

**Query Parameters**:

- `stationId`: Filter by station
- `brandId`: Filter by brand
- `status`: Filter by status (available, rented, maintenance)

**Example**:

```http
GET /api/vehicles?stationId=station-hcm-01&status=available
```

#### 🔍 Get Vehicle Detail

```http
GET /api/vehicles/:vehicleId
```

#### ➕ Create Vehicle (Admin only)

```http
POST /api/vehicles
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "vin": "EVR-2024-0051",
  "brand": "brand-id-here",
  "model": "Tesla Model 3",
  "plateNo": "51H-999.99",
  "batteryPercent": 100,
  "status": "available",
  "stationId": "station-hcm-01"
}
```

#### 🔄 Update Vehicle

```http
PUT /api/vehicles/:vehicleId
Authorization: Bearer <token>
```

---

### 5️⃣ Station APIs

#### 📋 List Stations

```http
GET /api/stations
```

**Response**:

```json
[
  {
    "_id": "...",
    "code": "station-hcm-01",
    "name": "Ho Chi Minh EV Hub",
    "address": {
      "street": "123 Nguyễn Huệ",
      "district": "Quận 1",
      "city": "TP.HCM"
    },
    "coordinates": {
      "lat": 10.7769,
      "lng": 106.7009
    },
    "isActive": true
  }
]
```

#### 🔍 Get Station Detail

```http
GET /api/stations/:stationId
```

---

### 6️⃣ Booking APIs ⭐ UPDATED

#### 📋 List Bookings

```http
GET /api/bookings
```

**Query Parameters**:

- `status`: `pending_payment`, `confirmed`, `cancelled`, `completed`, `expired`
- `email`: Filter by email
- `phoneNumber`: Filter by phone number
- `bookingCode`: Filter by booking code

**Example**:

```http
GET /api/bookings?status=pending_payment&email=customer@example.com
```

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "bookingCode": "BK20251031001",
      "renterName": "Nguyen Van A",
      "phoneNumber": "0912345678",
      "email": "customer@example.com",
      "brand": {
        "_id": "...",
        "name": "VinFast VF 3",
        "code": "VINFAST-VF3",
        "baseDailyRate": 590000
      },
      "pickupStation": {
        "_id": "...",
        "name": "Hanoi EV Station",
        "code": "station-hn-01"
      },
      "pickupDateTime": "2025-11-01T10:00:00.000Z",
      "returnDateTime": "2025-11-02T10:00:00.000Z",
      "rentalDays": 1,
      "basePrice": 590000,
      "additionalFees": 100000,
      "totalRentalFee": 690000,
      "depositAmount": 2000000,
      "totalPayable": 2690000,
      "status": "pending_payment"
    }
  ]
}
```

#### 🔍 Get Booking Detail

```http
GET /api/bookings/:bookingId
```

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "bookingCode": "BK20251031001",
    "renterName": "Nguyen Van A",
    "phoneNumber": "0912345678",
    "email": "customer@example.com",
    "brand": {
      "_id": "...",
      "name": "VinFast VF 3",
      "code": "VINFAST-VF3",
      "baseDailyRate": 590000,
      "depositAmount": 2000000,
      "imageUrl": "https://...",
      "specs": {...}
    },
    "pickupStation": {
      "_id": "...",
      "name": "Hanoi EV Station",
      "code": "station-hn-01",
      "address": "123 Phố Huế, Hoàn Kiếm, Hà Nội",
      "coordinates": {...}
    },
    "vehicle": null,
    "pickupDate": "2025-11-01T00:00:00.000Z",
    "pickupTime": "10:00",
    "returnDate": "2025-11-02T00:00:00.000Z",
    "returnTime": "10:00",
    "pickupDateTime": "2025-11-01T10:00:00.000Z",
    "returnDateTime": "2025-11-02T10:00:00.000Z",
    "rentalDays": 1,
    "basePrice": 590000,
    "additionalFees": 100000,
    "totalRentalFee": 690000,
    "depositAmount": 2000000,
    "totalPayable": 2690000,
    "paymentMethod": "online",
    "pickupLocation": "123 Main St, District 1",
    "promoCode": "NEWUSER10",
    "notes": "Cần xe sạch sẽ",
    "agreedToPaymentTerms": true,
    "agreedToDataSharing": true,
    "status": "pending_payment",
    "createdAt": "2025-10-31T12:00:00.000Z"
  }
}
```

#### ➕ Create Booking (Đăng ký thuê xe) ⭐ NEW

```http
POST /api/bookings
Content-Type: application/json

{
  "renterName": "Nguyen Thi Nhu Quynh",
  "phoneNumber": "0912345678",
  "email": "quynhntnss170152@fpt.edu.vn",
  "brandId": "673e5c123456789abcdef012",
  "stationId": "station-hn-01",
  "pickupDate": "2025-11-01",
  "pickupTime": "10:00",
  "returnDate": "2025-11-02",
  "returnTime": "10:00",
  "paymentMethod": "online",
  "agreedToPaymentTerms": true,
  "agreedToDataSharing": true,
  "pickupLocation": "123 Main St, District 1",
  "promoCode": "NEWUSER10",
  "notes": "Cần xe sạch sẽ"
}
```

**Required Fields**:

- `renterName`: Tên người thuê
- `phoneNumber`: Số điện thoại (10 số, bắt đầu bằng 0)
- `email`: Email hợp lệ
- `brandId`: ID của brand (xe)
- `stationId`: ID của trạm nhận xe
- `pickupDate`: Ngày nhận xe (YYYY-MM-DD)
- `pickupTime`: Giờ nhận xe (HH:mm)
- `returnDate`: Ngày trả xe (YYYY-MM-DD)
- `returnTime`: Giờ trả xe (HH:mm)
- `paymentMethod`: Phương thức thanh toán (`online`, `cash`, `bank_transfer`, `credit_card`, `e_wallet`)
- `agreedToPaymentTerms`: Đồng ý điều khoản thanh toán (true)
- `agreedToDataSharing`: Đồng ý chia sẻ dữ liệu (true)

**Optional Fields**:

- `pickupLocation`: Địa chỉ cụ thể nhận xe
- `promoCode`: Mã giới thiệu/khuyến mãi
- `notes`: Ghi chú thêm

**Response**:

```json
{
  "success": true,
  "message": "Đặt xe thành công",
  "data": {
    "_id": "673e5c1234567890abcdef01",
    "bookingCode": "BK20251031006",
    "renterName": "Nguyen Thi Nhu Quynh",
    "phoneNumber": "0912345678",
    "email": "quynhntnss170152@fpt.edu.vn",
    "brand": {
      "_id": "...",
      "name": "VinFast VF 3",
      "code": "VINFAST-VF3"
    },
    "station": {
      "_id": "...",
      "name": "Hanoi EV Station",
      "code": "station-hn-01"
    },
    "pickupDateTime": "2025-11-01T10:00:00.000Z",
    "returnDateTime": "2025-11-02T10:00:00.000Z",
    "rentalDays": 1,
    "pricing": {
      "basePrice": 590000,
      "additionalFees": 100000,
      "totalRentalFee": 690000,
      "depositAmount": 2000000,
      "totalPayable": 2690000
    },
    "paymentMethod": "online",
    "pickupLocation": "123 Main St, District 1",
    "promoCode": "NEWUSER10",
    "notes": "Cần xe sạch sẽ",
    "status": "pending_payment",
    "createdAt": "2025-10-31T12:00:00.000Z"
  }
}
```

**Pricing Logic**:

1. **Base Price** = `baseDailyRate × rentalDays`
2. **Additional Fees** = `100,000đ × số ngày cuối tuần` (Saturday/Sunday)
3. **Total Rental Fee** = `basePrice + additionalFees`
4. **Total Payable** = `totalRentalFee + depositAmount`

**Example Calculation**:

- VinFast VF 3: 590,000đ/ngày
- Rental: Fri 1/11 10:00 → Sat 2/11 10:00 (1 day)
- Saturday = 1 weekend day → +100,000đ phụ phí
- Base: 590,000đ
- Additional: 100,000đ (weekend)
- Total Rental: 690,000đ
- Deposit: 2,000,000đ
- **Total Payable: 2,690,000đ**

**Error Responses**:

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    "Số điện thoại không hợp lệ (phải là 10 số bắt đầu bằng 0)",
    "Email không hợp lệ",
    "Ngày nhận xe không được trong quá khứ"
  ]
}
```

#### ❌ Cancel Booking

```http
PUT /api/bookings/:bookingId/cancel
```

**Response**:

```json
{
  "success": true,
  "message": "Hủy booking thành công",
  "data": {
    "_id": "...",
    "bookingCode": "BK20251031001",
    "status": "cancelled"
  }
}
```

---

### 7️⃣ Rental APIs

#### 📋 List Rentals

```http
GET /api/rentals
Authorization: Bearer <token>
```

#### ➕ Create Rental (from Booking)

```http
POST /api/rentals
Authorization: Bearer <staff-token>
Content-Type: application/json

{
  "booking": "booking-id",
  "actualStartDate": "2025-11-05T10:00:00Z"
}
```

#### 🏁 Complete Rental

```http
PUT /api/rentals/:rentalId/complete
Authorization: Bearer <staff-token>
Content-Type: application/json

{
  "actualEndDate": "2025-11-08T15:30:00Z",
  "finalOdometer": 12850
}
```

---

### 8️⃣ Payment APIs

#### 📋 List Payments

```http
GET /api/payments
Authorization: Bearer <token>
```

#### ➕ Create Payment

```http
POST /api/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "rental": "rental-id",
  "amount": 4350000,
  "paymentMethod": "credit_card"
}
```

**Payment Methods**:

- `credit_card`
- `debit_card`
- `cash`
- `bank_transfer`
- `e_wallet`

---

### 9️⃣ Handover APIs

#### 📋 List Handovers

```http
GET /api/handovers
Authorization: Bearer <token>
```

#### ➕ Create Handover (Pickup/Return)

```http
POST /api/handovers
Authorization: Bearer <staff-token>
Content-Type: multipart/form-data

rental: rental-id
type: pickup
batteryLevel: 85
odometerReading: 12450
fuelLevel: 100
damages: Scratch on left door
photos: [file1.jpg, file2.jpg]
```

**Handover Types**:

- `pickup`: Nhận xe
- `return`: Trả xe

---

### 🔟 User Document APIs

#### 📋 List User Documents

```http
GET /api/user-documents
Authorization: Bearer <token>
```

#### ➕ Upload Document

```http
POST /api/user-documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

documentType: driver_license
file: license.jpg
expiryDate: 2030-12-31
```

**Document Types**:

- `driver_license`: Giấy phép lái xe
- `id_card`: CCCD/CMND
- `passport`: Hộ chiếu

---

## 🎨 Frontend Integration Guide

### React Example - Brand List by Station

```jsx
import { useState, useEffect } from "react";

function BrandListByStation({ stationId }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:4000/api/brands/by-station?stationId=${stationId}`)
      .then((res) => res.json())
      .then((data) => {
        setBrands(data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching brands:", err);
        setLoading(false);
      });
  }, [stationId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="brand-grid">
      {brands.map((brand) => (
        <BrandCard key={brand._id} brand={brand} />
      ))}
    </div>
  );
}

function BrandCard({ brand }) {
  const getStatusBadge = (status) => {
    const badges = {
      available: { text: "Miễn phí sạc", color: "green" },
      out_of_stock: { text: "Hết xe", color: "red" },
      no_vehicles: { text: "Không có xe", color: "gray" },
    };
    return badges[status] || badges.no_vehicles;
  };

  const badge = getStatusBadge(brand.availability.status);

  return (
    <div className="brand-card">
      <img src={brand.imageUrl} alt={brand.name} />

      <div className={`badge badge-${badge.color}`}>{badge.text}</div>

      <h3>{brand.name}</h3>
      <p className="price">
        Từ {brand.baseDailyRate.toLocaleString("vi-VN")} VND/Ngày
      </p>

      <div className="specs-grid">
        <div className="spec">
          <span className="icon">🚗</span>
          <span>{brand.specs.carType}</span>
        </div>
        <div className="spec">
          <span className="icon">👥</span>
          <span>{brand.specs.seats} chỗ</span>
        </div>
        <div className="spec">
          <span className="icon">⚡</span>
          <span>{brand.specs.range}km</span>
        </div>
        <div className="spec">
          <span className="icon">🧳</span>
          <span>{brand.specs.trunkCapacity}L</span>
        </div>
      </div>

      <div className="availability">
        <p>
          Còn {brand.availability.available}/{brand.availability.total} xe
        </p>
      </div>
    </div>
  );
}
```

### React Example - Brand Detail with Carousel

```jsx
import { useState, useEffect } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

function BrandDetail({ brandCode, stationId }) {
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:4000/api/brands/by-station?stationId=${stationId}`)
      .then((res) => res.json())
      .then((data) => {
        const foundBrand = data.data.find((b) => b.code === brandCode);
        setBrand(foundBrand);
        setLoading(false);
      });
  }, [brandCode, stationId]);

  if (loading) return <div>Loading...</div>;
  if (!brand) return <div>Brand not found</div>;

  const transmissionMap = {
    "single-speed": "Số tự động",
    automatic: "Số tự động",
    manual: "Số sàn",
    cvt: "CVT",
  };

  const carTypeMap = {
    minicar: "Minicar",
    sedan: "Sedan",
    suv: "SUV",
    crossover: "Crossover",
    hatchback: "Hatchback",
  };

  return (
    <div className="brand-detail">
      {/* Image Carousel */}
      <Carousel
        showThumbs={true}
        infiniteLoop={true}
        autoPlay={true}
        interval={3000}
      >
        {brand.images.map((img, idx) => (
          <div key={idx}>
            <img src={img} alt={`${brand.name} ${idx + 1}`} />
          </div>
        ))}
      </Carousel>

      <h1>{brand.name}</h1>
      <h2 className="price">
        {brand.baseDailyRate.toLocaleString("vi-VN")} VND/Ngày
      </h2>
      <p className="description">{brand.description}</p>

      {/* Main Specs */}
      <div className="specs-grid">
        <SpecItem icon="👥" label="Số chỗ" value={`${brand.specs.seats} chỗ`} />
        <SpecItem
          icon="⚡"
          label="Quãng đường"
          value={`${brand.specs.range}km (NEDC)`}
        />
        <SpecItem
          icon="🎛️"
          label="Hộp số"
          value={transmissionMap[brand.specs.transmission]}
        />
        <SpecItem
          icon="💨"
          label="Túi khí"
          value={`${brand.specs.airbags} túi khí`}
        />
        <SpecItem
          icon="🔋"
          label="Công suất"
          value={`${brand.specs.horsePower} HP`}
        />
        <SpecItem
          icon="🚙"
          label="Loại xe"
          value={carTypeMap[brand.specs.carType]}
        />
        <SpecItem
          icon="🧳"
          label="Dung tích cốp"
          value={`${brand.specs.trunkCapacity}L`}
        />
        <SpecItem
          icon="📏"
          label="Giới hạn KM/ngày"
          value={`${brand.specs.dailyKmLimit} km`}
        />
      </div>

      {/* Features */}
      <h3>Các tiện nghi khác</h3>
      <div className="features-grid">
        <Feature icon="📺" text={`Màn hình ${brand.specs.screenSize} inch`} />
        <Feature icon="⚙️" text={`La-zăng ${brand.specs.wheelSize} inch`} />
        {brand.features.map((feature, idx) => (
          <Feature key={idx} text={feature} />
        ))}
      </div>

      {/* Availability */}
      <div className="availability-section">
        <h3>Tình trạng xe tại trạm</h3>
        <div className="availability-stats">
          <div>Tổng: {brand.availability.total} xe</div>
          <div className="available">
            Sẵn sàng: {brand.availability.available} xe
          </div>
          <div>Đang thuê: {brand.availability.rented} xe</div>
          <div>Bảo trì: {brand.availability.maintenance} xe</div>
        </div>
      </div>

      <button className="btn-book">Đặt xe ngay</button>
    </div>
  );
}

function SpecItem({ icon, label, value }) {
  return (
    <div className="spec-item">
      <span className="icon">{icon}</span>
      <div>
        <div className="label">{label}</div>
        <div className="value">{value}</div>
      </div>
    </div>
  );
}

function Feature({ icon, text }) {
  return (
    <div className="feature-item">
      {icon && <span className="icon">{icon}</span>}
      <span>{text}</span>
    </div>
  );
}
```

### Station Selector Component

```jsx
function StationSelector({ onChange, selectedStation }) {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4000/api/stations")
      .then((res) => res.json())
      .then((data) => setStations(data));
  }, []);

  return (
    <select
      value={selectedStation}
      onChange={(e) => onChange(e.target.value)}
      className="station-selector"
    >
      <option value="">Chọn trạm</option>
      {stations.map((station) => (
        <option key={station.code} value={station.code}>
          {station.address.city} - {station.name}
        </option>
      ))}
    </select>
  );
}
```

### Authentication Hook

```jsx
import { useState, useEffect } from "react";

function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      fetch("http://localhost:4000/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
        });
    }
  }, [token]);

  const login = async (email, password) => {
    const response = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return { user, token, login, logout };
}
```

### React Example - Booking Form (Đăng ký thuê xe) ⭐ NEW

```jsx
import { useState, useEffect } from "react";

function BookingForm({ brandId, stationId }) {
  const [formData, setFormData] = useState({
    renterName: "",
    phoneNumber: "",
    email: "",
    pickupDate: "",
    pickupTime: "10:00",
    returnDate: "",
    returnTime: "10:00",
    paymentMethod: "online",
    agreedToPaymentTerms: false,
    agreedToDataSharing: false,
    pickupLocation: "",
    promoCode: "",
    notes: "",
  });

  const [pricing, setPricing] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  // Tính giá khi thay đổi ngày
  useEffect(() => {
    if (formData.pickupDate && formData.returnDate && brandId) {
      calculatePricing();
    }
  }, [formData.pickupDate, formData.returnDate, brandId]);

  const calculatePricing = async () => {
    // Gọi API để lấy thông tin brand và tính giá
    const brand = await fetch(
      `http://localhost:4000/api/brands/${brandId}`
    ).then((res) => res.json());

    const pickupDateTime = new Date(
      `${formData.pickupDate}T${formData.pickupTime}`
    );
    const returnDateTime = new Date(
      `${formData.returnDate}T${formData.returnTime}`
    );

    const diffDays = Math.ceil(
      (returnDateTime - pickupDateTime) / (1000 * 60 * 60 * 24)
    );
    const rentalDays = Math.max(diffDays, 1);

    // Tính phụ phí cuối tuần
    let additionalFees = 0;
    const current = new Date(pickupDateTime);
    while (current < returnDateTime) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        additionalFees += 100000;
      }
      current.setDate(current.getDate() + 1);
    }

    const basePrice = brand.baseDailyRate * rentalDays;
    const totalRentalFee = basePrice + additionalFees;
    const depositAmount = brand.depositAmount;
    const totalPayable = totalRentalFee + depositAmount;

    setPricing({
      rentalDays,
      basePrice,
      additionalFees,
      totalRentalFee,
      depositAmount,
      totalPayable,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:4000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          brandId,
          stationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || [data.message]);
        setLoading(false);
        return;
      }

      setSuccess(data);
      setLoading(false);

      // Redirect hoặc hiển thị success message
      console.log("Booking created:", data);
    } catch (error) {
      setErrors(["Đã có lỗi xảy ra. Vui lòng thử lại."]);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="booking-success">
        <h2>✅ Đặt xe thành công!</h2>
        <p>
          Mã booking: <strong>{success.data.bookingCode}</strong>
        </p>
        <p>
          Tổng tiền:{" "}
          <strong>
            {success.data.pricing.totalPayable.toLocaleString("vi-VN")}đ
          </strong>
        </p>
        <p>Chúng tôi đã gửi email xác nhận đến {success.data.email}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="booking-form">
      <h2>📝 Đăng ký thuê xe</h2>

      {errors.length > 0 && (
        <div className="errors">
          {errors.map((error, idx) => (
            <p key={idx} className="error">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Thông tin người thuê */}
      <div className="form-section">
        <h3>Thông tin người thuê</h3>

        <div className="form-group">
          <label>Họ và tên *</label>
          <input
            type="text"
            name="renterName"
            value={formData.renterName}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            required
          />
        </div>

        <div className="form-group">
          <label>Số điện thoại *</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="0912345678"
            pattern="^0[0-9]{9}$"
            required
          />
          <small>10 số, bắt đầu bằng 0</small>
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@email.com"
            required
          />
        </div>
      </div>

      {/* Thời gian thuê */}
      <div className="form-section">
        <h3>Thời gian thuê</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Ngày nhận xe *</label>
            <input
              type="date"
              name="pickupDate"
              value={formData.pickupDate}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="form-group">
            <label>Giờ nhận xe *</label>
            <input
              type="time"
              name="pickupTime"
              value={formData.pickupTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ngày trả xe *</label>
            <input
              type="date"
              name="returnDate"
              value={formData.returnDate}
              onChange={handleChange}
              min={
                formData.pickupDate || new Date().toISOString().split("T")[0]
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Giờ trả xe *</label>
            <input
              type="time"
              name="returnTime"
              value={formData.returnTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      {/* Chi tiết thêm */}
      <div className="form-section">
        <h3>Chi tiết thêm (Tùy chọn)</h3>

        <div className="form-group">
          <label>Địa chỉ cụ thể nhận xe</label>
          <input
            type="text"
            name="pickupLocation"
            value={formData.pickupLocation}
            onChange={handleChange}
            placeholder="123 Đường ABC, Quận 1"
          />
        </div>

        <div className="form-group">
          <label>Mã giới thiệu/khuyến mãi</label>
          <input
            type="text"
            name="promoCode"
            value={formData.promoCode}
            onChange={handleChange}
            placeholder="NEWUSER10"
          />
        </div>

        <div className="form-group">
          <label>Ghi chú</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Yêu cầu đặc biệt..."
            rows="3"
          />
        </div>
      </div>

      {/* Phương thức thanh toán */}
      <div className="form-section">
        <h3>Phương thức thanh toán *</h3>

        <div className="payment-methods">
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="online"
              checked={formData.paymentMethod === "online"}
              onChange={handleChange}
            />
            <span>💳 Thanh toán online</span>
          </label>

          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={formData.paymentMethod === "cash"}
              onChange={handleChange}
            />
            <span>💵 Tiền mặt</span>
          </label>

          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="bank_transfer"
              checked={formData.paymentMethod === "bank_transfer"}
              onChange={handleChange}
            />
            <span>🏦 Chuyển khoản ngân hàng</span>
          </label>

          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="credit_card"
              checked={formData.paymentMethod === "credit_card"}
              onChange={handleChange}
            />
            <span>💳 Thẻ tín dụng</span>
          </label>

          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="e_wallet"
              checked={formData.paymentMethod === "e_wallet"}
              onChange={handleChange}
            />
            <span>📱 Ví điện tử</span>
          </label>
        </div>
      </div>

      {/* Tổng tiền */}
      {pricing && (
        <div className="pricing-summary">
          <h3>💰 Chi tiết giá</h3>
          <div className="pricing-row">
            <span>Giá thuê cơ bản ({pricing.rentalDays} ngày):</span>
            <span>{pricing.basePrice.toLocaleString("vi-VN")}đ</span>
          </div>
          {pricing.additionalFees > 0 && (
            <div className="pricing-row highlight">
              <span>Phụ phí cuối tuần:</span>
              <span>+{pricing.additionalFees.toLocaleString("vi-VN")}đ</span>
            </div>
          )}
          <div className="pricing-row">
            <span>Tổng tiền thuê:</span>
            <span className="bold">
              {pricing.totalRentalFee.toLocaleString("vi-VN")}đ
            </span>
          </div>
          <div className="pricing-row">
            <span>Tiền cọc:</span>
            <span>{pricing.depositAmount.toLocaleString("vi-VN")}đ</span>
          </div>
          <div className="pricing-row total">
            <span>Tổng thanh toán:</span>
            <span className="total-amount">
              {pricing.totalPayable.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>
      )}

      {/* Đồng ý điều khoản */}
      <div className="form-section">
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              name="agreedToPaymentTerms"
              checked={formData.agreedToPaymentTerms}
              onChange={handleChange}
              required
            />
            <span>Tôi đồng ý với điều khoản thanh toán *</span>
          </label>

          <label>
            <input
              type="checkbox"
              name="agreedToDataSharing"
              checked={formData.agreedToDataSharing}
              onChange={handleChange}
              required
            />
            <span>Tôi đồng ý chia sẻ dữ liệu cá nhân *</span>
          </label>
        </div>
      </div>

      <button type="submit" className="btn-submit" disabled={loading}>
        {loading ? "Đang xử lý..." : "🚗 Đặt xe ngay"}
      </button>
    </form>
  );
}

export default BookingForm;
```

---

## 📦 Data Models

### Brand Schema

```javascript
{
  code: String,              // "TESLA-M3"
  name: String,              // "Tesla Model 3"
  description: String,
  baseDailyRate: Number,     // 1450000
  depositAmount: Number,     // 5000000
  imageUrl: String,
  images: [String],          // ["url1", "url2", "url3", "url4"]
  specs: {
    seats: Number,           // 5
    range: Number,           // 580 km
    horsePower: Number,      // 283 HP
    batteryCapacity: Number, // 60 kWh
    transmission: String,    // "single-speed"
    fuelType: String,        // "electric"
    carType: String,         // "sedan"
    trunkCapacity: Number,   // 425 lít
    airbags: Number,         // 8
    wheelSize: Number,       // 19 inch
    screenSize: Number,      // 15 inch
    dailyKmLimit: Number     // 500 km/ngày
  },
  manufacturer: {
    country: String,         // "USA"
    website: String
  },
  features: [String],
  isActive: Boolean
}
```

### Vehicle Schema

```javascript
{
  vin: String,               // "EVR-2024-0001"
  brand: ObjectId,           // ref: Brand
  model: String,             // "Tesla Model 3"
  plateNo: String,           // "51H-123.45"
  batteryPercent: Number,    // 85
  status: String,            // "available" | "rented" | "maintenance"
  odometer: Number,          // 12450 km
  stationId: String          // "station-hcm-01"
}
```

### Station Schema

```javascript
{
  code: String,              // "station-hcm-01"
  name: String,              // "Ho Chi Minh EV Hub"
  address: {
    street: String,
    district: String,
    city: String
  },
  coordinates: {
    lat: Number,             // 10.7769
    lng: Number              // 106.7009
  },
  isActive: Boolean
}
```

### User Schema

```javascript
{
  email: String,
  password: String,          // hashed
  fullName: String,
  phoneNumber: String,
  role: String,              // "admin" | "staff" | "customer"
  isActive: Boolean
}
```

### Booking Schema ⭐ UPDATED

```javascript
{
  bookingCode: String,           // "BK20251031001" (auto-generated)
  renterName: String,            // "Nguyen Van A"
  phoneNumber: String,           // "0912345678" (validated: 10 digits, starts with 0)
  email: String,                 // "customer@example.com" (validated)

  brand: ObjectId,               // ref: Brand
  pickupStation: ObjectId,       // ref: Station
  vehicle: ObjectId,             // ref: Vehicle (optional, assigned by staff)

  // Thời gian
  pickupDate: Date,              // Ngày nhận xe
  pickupTime: String,            // "10:00" (HH:mm format)
  returnDate: Date,              // Ngày trả xe
  returnTime: String,            // "10:00" (HH:mm format)
  pickupDateTime: Date,          // Parsed datetime nhận xe
  returnDateTime: Date,          // Parsed datetime trả xe
  rentalDays: Number,            // Số ngày thuê (calculated)

  // Giá cả
  basePrice: Number,             // Giá cơ bản (baseDailyRate × rentalDays)
  additionalFees: Number,        // Phụ phí cuối tuần (100,000đ × số ngày Sat/Sun)
  totalRentalFee: Number,        // Tổng tiền thuê (basePrice + additionalFees)
  depositAmount: Number,         // Tiền cọc
  totalPayable: Number,          // Tổng thanh toán (totalRentalFee + depositAmount)

  // Thanh toán
  paymentMethod: String,         // "online" | "cash" | "bank_transfer" | "credit_card" | "e_wallet"

  // Thông tin thêm (optional)
  pickupLocation: String,        // Địa chỉ cụ thể nhận xe
  promoCode: String,             // Mã khuyến mãi
  notes: String,                 // Ghi chú

  // Đồng ý điều khoản
  agreedToPaymentTerms: Boolean, // Required: true
  agreedToDataSharing: Boolean,  // Required: true

  // Trạng thái
  status: String,                // "pending_payment" | "confirmed" | "cancelled" | "completed" | "expired"

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Booking Status Flow**:

1. `pending_payment` - Mới tạo, chờ thanh toán
2. `confirmed` - Đã thanh toán, chờ nhận xe
3. `completed` - Đã hoàn thành
4. `cancelled` - Đã hủy
5. `expired` - Hết hạn (quá thời gian pickup)

**Pricing Calculation**:

- Base Price = `baseDailyRate × rentalDays`
- Additional Fees = `100,000đ × số ngày cuối tuần (Sat/Sun)`
- Total Rental Fee = `basePrice + additionalFees`
- Total Payable = `totalRentalFee + depositAmount`

### Rental Schema

```javascript
{
  booking: ObjectId,         // ref: Booking
  vehicle: ObjectId,         // ref: Vehicle
  user: ObjectId,            // ref: User
  actualStartDate: Date,
  actualEndDate: Date,
  totalAmount: Number,
  status: String             // "active" | "completed" | "cancelled"
}
```

### Payment Schema

```javascript
{
  rental: ObjectId,          // ref: Rental
  amount: Number,
  paymentMethod: String,     // "credit_card" | "cash" | "bank_transfer" | "e_wallet"
  status: String,            // "pending" | "completed" | "failed" | "refunded"
  transactionId: String
}
```

### Handover Schema

```javascript
{
  rental: ObjectId,          // ref: Rental
  type: String,              // "pickup" | "return"
  station: String,
  batteryLevel: Number,
  odometerReading: Number,
  fuelLevel: Number,
  damages: String,
  photos: [String]
}
```

---

## ⚠️ Error Handling

### Error Response Format

```json
{
  "message": "Error message",
  "error": "Detailed error information"
}
```

### Common HTTP Status Codes

| Code | Meaning                            |
| ---- | ---------------------------------- |
| 200  | OK - Request thành công            |
| 201  | Created - Tạo resource thành công  |
| 400  | Bad Request - Request không hợp lệ |
| 401  | Unauthorized - Chưa đăng nhập      |
| 403  | Forbidden - Không có quyền         |
| 404  | Not Found - Không tìm thấy         |
| 500  | Internal Server Error - Lỗi server |

### Example Error Response

```json
{
  "message": "Validation error",
  "error": "Email is required"
}
```

---

## 📤 Upload Files

### Handover Photos

```bash
POST /api/handovers
Content-Type: multipart/form-data
Authorization: Bearer <token>

rental: rental-id
type: pickup
batteryLevel: 85
photos: [file1.jpg, file2.jpg]
```

### User Documents

```bash
POST /api/user-documents
Content-Type: multipart/form-data
Authorization: Bearer <token>

documentType: driver_license
file: license.jpg
expiryDate: 2030-12-31
```

**Supported Formats**: JPG, JPEG, PNG  
**Max File Size**: 5MB

---

## 🧪 Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Get brands by station
curl http://localhost:4000/api/brands/by-station?stationId=station-hcm-01

# Get current user (with token)
curl http://localhost:4000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import collection từ Swagger: `http://localhost:4000/docs`
2. Set environment variables:
   - `baseUrl`: `http://localhost:4000`
   - `token`: JWT token sau khi login

### Test với PowerShell

```powershell
# Login
$response = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123"}'

$token = $response.token

# Get brands by station
Invoke-RestMethod -Uri "http://localhost:4000/api/brands/by-station?stationId=station-hcm-01"

# Get current user
Invoke-RestMethod -Uri "http://localhost:4000/api/users/me" `
  -Headers @{"Authorization"="Bearer $token"}
```

---

## 📞 Support

### Documentation

- **Swagger UI**: http://localhost:4000/docs
- **GitHub**: https://github.com/AbandonedDemon/ev-rental-system-backend

### Contact

- **Email**: support@ev-rental.com
- **Phone**: 1900-xxxx

### Issues

Report bugs tại: https://github.com/AbandonedDemon/ev-rental-system-backend/issues

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🎉 Changelog

### Version 1.0.0 (2025-11-01)

**New Features**:

- ✅ Brand by Station API với availability status
- ✅ Complete vehicle specifications (trunkCapacity, airbags, wheelSize, screenSize, dailyKmLimit)
- ✅ Multiple images array cho carousel
- ✅ 50 vehicles test data
- ✅ 10 brands với đầy đủ specs
- ✅ 4 stations tại Việt Nam

**Database**:

- ✅ Seeded 50 vehicles
- ✅ Seeded 10 brands
- ✅ Seeded 4 stations
- ✅ Seeded 5 test users

**API Updates**:

- ✅ GET /api/brands/by-station - New endpoint
- ✅ Enhanced Brand model với specs mở rộng
- ✅ Images array support

---

**Made with ❤️ for EV Rental System**  
**Last Updated**: November 1, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
