# 🤖 PROMPT CHO FRONTEND AGENT

## CONTEXT
Backend EV Rental System vừa reset database và reseed với ObjectId mới. Database hiện có **50 vehicles** và **10 brands**, nhưng Frontend đang gặp lỗi không lấy được số lượng xe.

---

## NHIỆM VỤ

Kiểm tra và sửa lỗi Frontend để:

1. **Lấy được danh sách xe từ API**
2. **Hiển thị số lượng xe có sẵn**
3. **Tạo booking thành công không bị lỗi validation**

---

## API DOCUMENTATION

Đọc file `FRONTEND_API_GUIDE.md` để biết:
- Các API endpoint có sẵn
- Response format của từng API
- Cách lấy số lượng xe
- Cách fix lỗi ObjectId

---

## CHECKLIST KIỂM TRA

### 1. Kiểm tra API đang gọi có đúng không?

**API ĐÚNG để lấy số lượng xe:**

#### Option 1: Lấy tất cả xe
```http
GET /api/vehicles
```
Response có `data` array với tất cả vehicles

#### Option 2: Lấy xe theo station
```http
GET /api/vehicles?stationId={stationId}
```

#### Option 3: Lấy brands với availability (RECOMMENDED)
```http
GET /api/brands/by-station?stationId={stationId}
```
Response có `availableVehicleCount` cho từng brand

**❌ SAI nếu đang gọi:**
- `/api/vehicles/count` (API này không tồn tại)
- `/api/brands/vehicles-count` (Sai format)

---

### 2. Kiểm tra response có data không?

```javascript
// Test API trong browser console hoặc Postman
fetch('http://localhost:5000/api/vehicles')
  .then(res => res.json())
  .then(data => {
    console.log('Total vehicles:', data.data.length);
    console.log('First vehicle:', data.data[0]);
  });
```

**Expected output:**
```
Total vehicles: 50
First vehicle: { _id: "6908d0bc0222ed11d2901d86", ... }
```

---

### 3. Kiểm tra Frontend có cache ObjectId cũ không?

```javascript
// Check localStorage
console.log('Cached brands:', localStorage.getItem('brands'));
console.log('Cached vehicles:', localStorage.getItem('vehicles'));

// Check sessionStorage
console.log('Session brands:', sessionStorage.getItem('brands'));
```

**Nếu có cache → Clear ngay:**
```javascript
localStorage.clear();
sessionStorage.clear();
```

---

### 4. Kiểm tra code Frontend đang lấy xe như thế nào?

**TÌM CÁC VẤN ĐỀ SAU:**

#### Vấn đề 1: Hardcoded ObjectId
```javascript
// ❌ SAI - Hardcoded ID cũ
const brandId = "507f1f77bcf86cd799439011";

// ✅ ĐÚNG - Fetch từ API
const brands = await fetchBrands();
const brandId = brands[0]._id;
```

#### Vấn đề 2: Gọi sai endpoint
```javascript
// ❌ SAI - Endpoint không tồn tại
const response = await fetch('/api/vehicles/count');

// ✅ ĐÚNG - Lấy array và count length
const response = await fetch('/api/vehicles');
const { data } = await response.json();
const vehicleCount = data.length;
```

#### Vấn đề 3: Không populate brand
```javascript
// Nếu cần thông tin brand, dùng:
const response = await fetch('/api/vehicles?stationId=xxx');
// Backend tự động populate brand và stationId
```

#### Vấn đề 4: Không handle error
```javascript
// ✅ Thêm error handling
try {
  const response = await fetch('/api/vehicles');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const { data } = await response.json();
  console.log('Vehicles:', data.length);
} catch (error) {
  console.error('Failed to fetch vehicles:', error);
}
```

---

### 5. Kiểm tra Network Tab

Mở Chrome DevTools → Network → Reload page

**Tìm request `/api/vehicles`:**
- Status: 200 OK?
- Response: Có `data` array với 50 items?
- Headers: `Content-Type: application/json`?

**Nếu không có request → Frontend chưa gọi API**
**Nếu status 404 → URL sai**
**Nếu status 500 → Backend error**

---

## CÁC SCENARIO CẦN XỬ LÝ

### Scenario 1: Hiển thị tổng số xe có sẵn

```javascript
// Component: Dashboard hoặc Home
const [vehicleCount, setVehicleCount] = useState(0);

useEffect(() => {
  const fetchVehicleCount = async () => {
    const response = await fetch('http://localhost:5000/api/vehicles');
    const { data } = await response.json();
    setVehicleCount(data.length);
  };
  fetchVehicleCount();
}, []);

return <div>Tổng số xe: {vehicleCount}</div>;
```

---

### Scenario 2: Hiển thị số xe theo loại (brand)

```javascript
// Component: VehicleSelection
const [brands, setBrands] = useState([]);

useEffect(() => {
  const fetchBrands = async () => {
    const stationId = selectedStation._id;
    const response = await fetch(
      `http://localhost:5000/api/brands/by-station?stationId=${stationId}`
    );
    const { data } = await response.json();
    setBrands(data);
  };
  fetchBrands();
}, [selectedStation]);

return (
  <div>
    {brands.map(item => (
      <BrandCard
        key={item.brand._id}
        brand={item.brand}
        availableCount={item.availableVehicleCount}
        isAvailable={item.isAvailable}
      />
    ))}
  </div>
);
```

---

### Scenario 3: Tạo booking với ObjectId mới

```javascript
// Component: BookingForm
const createBooking = async (formData) => {
  // Fetch fresh IDs từ selected brand và vehicle
  const brand = selectedBrand._id;    // Từ state, ĐÃ fetch từ API
  const vehicle = selectedVehicle._id; // Từ state, ĐÃ fetch từ API

  const response = await fetch('http://localhost:5000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: currentUser._id,
      brand: brand,                    // ObjectId mới
      vehicle: vehicle,                // ObjectId mới
      pickupStationId: formData.pickupStation,
      returnStationId: formData.returnStation,
      startDate: formData.startDate,
      endDate: formData.endDate
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Booking failed:', error);
    // Nếu lỗi "Brand không tồn tại" → Refetch brands
    if (error.message.includes('Brand không tồn tại')) {
      console.log('Refetching brands...');
      await refetchBrands();
    }
  }
};
```

---

## DEBUGGING STEPS

### Bước 1: Test API trực tiếp
```bash
# Trong terminal hoặc Postman
curl http://localhost:5000/api/vehicles

# Hoặc trong browser console
fetch('http://localhost:5000/api/vehicles')
  .then(r => r.json())
  .then(d => console.log('Vehicles:', d.data.length));
```

**Expected:** `Vehicles: 50`

---

### Bước 2: Tìm nơi Frontend gọi API xe

```bash
# Search trong codebase Frontend
grep -r "api/vehicles" src/
grep -r "fetchVehicles" src/
grep -r "getVehicles" src/
```

Kiểm tra:
- Function có được gọi không?
- URL có đúng không?
- Response có được xử lý không?

---

### Bước 3: Check component lifecycle

```javascript
// Thêm log để debug
useEffect(() => {
  console.log('🔍 Fetching vehicles...');
  fetchVehicles().then(data => {
    console.log('✅ Vehicles received:', data.length);
  }).catch(err => {
    console.error('❌ Fetch failed:', err);
  });
}, []);
```

---

### Bước 4: Verify data flow

```javascript
// Trong component hiển thị số lượng xe
console.log('Current state:', {
  vehicles: vehicles,
  vehicleCount: vehicles?.length,
  brands: brands,
  selectedStation: selectedStation
});
```

---

## EXPECTED FIXES

### Fix 1: Sửa API endpoint
```diff
- const url = '/api/vehicles/count';
+ const url = '/api/vehicles';
+ const { data } = await response.json();
+ const count = data.length;
```

### Fix 2: Clear cache và refetch
```diff
+ // Clear cache when mounting component
+ useEffect(() => {
+   localStorage.removeItem('brands');
+   localStorage.removeItem('vehicles');
+ }, []);

  useEffect(() => {
    fetchBrands();
    fetchVehicles();
  }, [selectedStation]);
```

### Fix 3: Sử dụng ObjectId từ API response
```diff
  const handleSelectBrand = (brand) => {
-   const brandId = "507f1f77bcf86cd799439011"; // Hardcoded
+   const brandId = brand._id; // Từ API response
    setSelectedBrand(brand);
  };
```

---

## SUCCESS CRITERIA

✅ **Frontend hiển thị: "Tổng số xe: 50"**
✅ **Mỗi brand hiển thị số xe có sẵn (VD: Tesla Model 3: 5 xe)**
✅ **Tạo booking thành công, không lỗi validation**
✅ **Console không có error về API**

---

## NEXT STEPS

1. **Đọc kỹ file `FRONTEND_API_GUIDE.md`**
2. **Test từng API endpoint trong Postman/Thunder Client**
3. **Tìm và sửa code Frontend gọi API sai**
4. **Clear cache và test lại**
5. **Report lại kết quả:**
   - API nào đang gọi?
   - Response là gì?
   - Có lỗi gì không?
   - Số lượng xe có hiển thị chưa?

---

## CONTACT BACKEND

Nếu confirm Frontend đã gọi API đúng nhưng vẫn không có data:
- Check xem backend server có đang chạy không?
- Check production backend đã reset DB chưa?
- Gửi screenshot network tab cho backend team

**Backend confirmation:**
```
✅ Local database: 50 vehicles, 10 brands
⏳ Production: Cần chạy reseed:prod
```
