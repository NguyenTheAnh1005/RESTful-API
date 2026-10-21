# Lab 2 Monolithic

Backend MVP: Node.js, Express, Prisma 6, PostgreSQL, JWT, Docker Compose.

## Chạy hệ thống

Mở terminal PowerShell trong thư mục dự án (Docker Desktop phải đang chạy):

```powershell
docker compose up -d --build --wait
docker compose ps
npm run health
```

Nếu terminal chưa nhận `docker` sau khi cài Docker Desktop, mở lại terminal hoặc dùng:

```powershell
$env:Path += ";$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin"
```

`.env` đã được tạo riêng trên máy này. Khi tải mã từ GitHub, sao chép `.env.example` thành `.env`, thay mật khẩu PostgreSQL ở cả POSTGRES_PASSWORD và DATABASE_URL, thay JWT_SECRET bằng chuỗi ngẫu nhiên ít nhất 32 ký tự. DATABASE_URL dùng host `db` trong mạng Compose. Cổng API là 3002 để tránh bài 1 ở cổng 3000. Không cần cài PostgreSQL trên Windows.

## Đối chiếu 8 tiêu chí chấm

1. **Monolithic:** toàn bộ API chạy trong một tiến trình Express, một image ứng dụng. `src/routes` nhận HTTP, `src/middleware/auth.js` xác minh JWT, `src/services/orders.js` xử lý đặt hàng, `src/db.js` tạo Prisma Client. PostgreSQL là container dữ liệu, không phải microservice nghiệp vụ.
2. **GitHub, .gitignore, .env:** `.env` chứa cấu hình thật và bị Git bỏ qua; `.env.example` là mẫu được đưa lên GitHub. `node_modules` cũng bị bỏ qua, `package-lock.json` được lưu để cài đúng phiên bản. Repository GitHub: https://github.com/NguyenTheAnh1005/RESTful-API.
3. **Prisma:** `prisma/schema.prisma` chứa đúng 7 model, quan hệ và kiểu theo sơ đồ. `OrderDetail` có khóa ghép `(oid,pid)`. `User.username` unique để tránh đăng nhập mơ hồ. PostgreSQL dùng timestamp cho DATETIME. Ngoài 7 bảng nghiệp vụ, Prisma tự tạo bảng kỹ thuật `_prisma_migrations` để theo dõi migration; đây không phải chức năng bổ sung. Migration tạo bảng; seed chỉ tạo role normal và membership normal/10. Prisma Client thực hiện truy vấn; transaction đảm bảo tạo đơn, trừ kho và tạo shipment cùng thành công hoặc cùng hoàn tác.
4. **Compose và health:** chạy các lệnh phía trên. Compose gồm `api` và `db`; API đợi database healthy. `/health` thực hiện SELECT 1 để kiểm tra kết nối thật.
5. **Bảng dữ liệu, tạo X và Y bằng CLI:**

```powershell
docker compose exec db psql -U lab2 -d lab2 -c '\dt'
Get-Content scripts/products.sql | docker compose exec -T db psql -U lab2 -d lab2
```

Script thêm X và Y, giá lần lượt 100000 và 200000, tồn kho mỗi loại 20. Ghi lại pid trả về để điền pidX và pidY trong Postman. Mỗi lần chạy script sẽ thêm cặp sản phẩm mới; đây là dữ liệu demo, không phải chức năng sản phẩm mở rộng.

6. **Đăng ký và đăng nhập:** import `postman/Lab2.postman_collection.json`. Request đăng ký tự tạo username mới theo thời gian để chạy lại không trùng; đặt pidX/pidY đúng kết quả CLI. Chạy request 2 và 3: tài khoản tự gán role normal và membership score 10; response đăng nhập chứa token và Postman tự lưu biến token. `fullname` có thể bỏ qua; khi đó lưu username làm tên mặc định để vẫn giữ đúng cột `User.fullname` trong database. Không trả mật khẩu/hash ra response.
7. **Đặt hàng và shipment:** chạy request 4 để thấy 401 khi thiếu token. Chạy request 5 để đặt X x2, Y x5. `createat` lấy thời gian database, hiển thị ISO UTC. Request 6 xem đơn và detail; request 7 xem shipment. `unit_price` lấy giá từ Product tại lúc đặt. Shipment tự tạo với status `pending`; đây là giá trị khởi tạo tối thiểu, đề không quy định chuỗi trạng thái. Chỉ người mua xem được đơn của mình.
8. **Kiểm tra bằng CLI:**

```powershell
Get-Content scripts/verify.sql | docker compose exec -T db psql -U lab2 -d lab2
```

Sau đúng một lượt mua với cặp sản phẩm vừa tạo: X còn 18, Y còn 15; Order có uid đúng, thời gian hiện hành; OrderDetail có qty 2 và 5, giá đúng; Shipment có oid đúng. Các lượt mua tiếp theo tiếp tục trừ kho, nên cần đối chiếu tồn kho trước/sau mỗi lượt.

## API

| Method | Path | Nội dung |
| --- | --- | --- |
| GET | /health | Tình trạng API và database |
| POST | /auth/register | username, password; fullname không bắt buộc |
| POST | /auth/login | username, password; trả token |
| POST | /orders | Bearer token; items gồm pid và qty |
| GET | /orders/:id | Bearer token; xem đơn và chi tiết |
| GET | /orders/:id/shipments | Bearer token; xem shipment |

Không triển khai frontend, thanh toán, giỏ hàng, CRUD toàn bộ bảng hay chức năng của bài 1/3.

## Dừng và xem log

```powershell
docker compose logs api
docker compose down
```

Lệnh down giữ dữ liệu trong volume; không dùng `down -v` nếu cần giữ bài demo.

## Kiểm tra tích hợp bổ sung

Sau khi tạo cặp sản phẩm mới bằng CLI, có thể chạy `node scripts/check-flow.js <pidX> <pidY>`. Script kiểm tra JWT, đăng ký mặc định, đơn hợp lệ, thiếu tồn kho và quyền xem đơn; tạo dữ liệu demo thật. Dùng script verify.sql để đối chiếu tồn kho và xác nhận giao dịch lỗi đã hoàn tác. Kịch bản này hỗ trợ kiểm thử, không thay thế phần trình diễn Postman trong phiếu chấm.

## Kết quả kiểm tra trên máy

- Hai container lab2-api-1 và lab2-db-1 đều healthy.
- Script kiểm tra tích hợp đã PASS, gồm trường hợp thiếu tồn kho và đối chiếu SQL xác nhận rollback.
- Collection Postman được chạy bằng Newman: 7 request, 9 assertion, không lỗi. Chưa thao tác trình diễn trong cửa sổ Postman.
- Đã có hai đơn demo (oid 1 và 2), mỗi đơn X x2, Y x5. Tồn hiện tại X=16 và Y=10, ban đầu mỗi loại 20.
- Git đã khởi tạo và .env bị bỏ qua. Repository đích: https://github.com/NguyenTheAnh1005/RESTful-API.
- npm audit báo 4 mục mức high trong chuỗi phụ thuộc Prisma CLI (@prisma/config, deepmerge-ts, effect, prisma). Chưa áp dụng ép phiên bản lớn/giảm phiên bản tự động; đây là hạn chế thư viện còn tồn tại của bản chạy lab này.
