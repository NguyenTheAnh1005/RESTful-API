-- Chạy một lần trước lượt chấm; ghi lại pid trả về để điền trong Postman.
INSERT INTO "Product" (pname, price, quantity)
VALUES ('X', 100000.00, 20), ('Y', 200000.00, 20)
RETURNING *;
