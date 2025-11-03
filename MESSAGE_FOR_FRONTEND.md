# 📨 MESSAGE FOR FRONTEND TEAM

## 🚨 URGENT: Database đã được reset với ObjectId mới!

### TL;DR
- ✅ Backend có **50 xe** và **10 brands**
- ❌ Frontend không thấy xe vì:
  1. Đang dùng **ObjectId cũ** cho brands/vehicles
  2. Đang gửi **station code** thay vì **station ObjectId**
- 🔧 **Cần refetch tất cả brands, vehicles VÀ stations từ API**

---

## API ĐỂ LẤY SỐ LƯỢNG XE

### 1. Lấy tất cả xe (đơn giản nhất)
```http
GET /api/vehicles
```
→ Trả về array `data` với 50 vehicles

### 2. Lấy brands với số xe available (recommended)
```http
GET /api/brands/by-station?stationId={stationId}
```
→ Response có `availability` object cho từng brand

**⚠️ QUAN TRỌNG:** `stationId` phải là **MongoDB ObjectId** (24 ký tự hex), KHÔNG phải station code!

```javascript
// ❌ SAI - Dùng station code
GET /api/brands/by-station?stationId=station-hcm-01

// ✅ ĐÚNG - Dùng ObjectId
GET /api/brands/by-station?stationId=6908d0bb0222ed11d2901d78
```

---

## CÁCH FIX NHANH

### Bước 1: Clear cache
```javascript
localStorage.clear();
sessionStorage.clear();
```

### Bước 2: Refetch brands và vehicles
```javascript
// ĐỪNG dùng ObjectId hardcoded hoặc cached!
const brands = await fetch('/api/brands').then(r => r.json());
const vehicles = await fetch('/api/vehicles').then(r => r.json());

// Dùng ObjectId từ response này để tạo booking
```

### Bước 3: Test API trước
```javascript
// Trong browser console:
fetch('http://localhost:5000/api/vehicles')
  .then(r => r.json())
  .then(d => console.log('Total vehicles:', d.data.length));
// Expected: 50
```

---

## CHECKLIST

- [ ] Gọi API `/api/vehicles` trả về 50 xe?
- [ ] Console có error gì không?
- [ ] Frontend có dùng ObjectId hardcoded không?
- [ ] Đã clear localStorage/cache chưa?

---

## CHI TIẾT ĐẦY ĐỦ

→ Xem file **`FRONTEND_API_GUIDE.md`** để biết tất cả API
→ Xem file **`PROMPT_FOR_FRONTEND_AGENT.md`** để có checklist debug chi tiết

---

## BACKEND STATUS

| Environment | Database Status | Vehicles | Brands |
|-------------|----------------|----------|--------|
| Local       | ✅ Đã reseed    | 50       | 10     |
| Production  | ⏳ Chưa reseed  | Old data | Old data |

**Action required:** Chạy `npm run reseed:prod` trên production (DigitalOcean Console)
