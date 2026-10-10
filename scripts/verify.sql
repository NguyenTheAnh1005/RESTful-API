\dt
SELECT * FROM "Role";
SELECT * FROM "MemberShip";
SELECT u.uid, u.username, r.rolename, m.score FROM "User" u JOIN "Role" r USING (roleid) JOIN "MemberShip" m USING (mid);
SELECT * FROM "Order" ORDER BY oid;
SELECT * FROM "OrderDetail" ORDER BY oid, pid;
SELECT * FROM "Product" ORDER BY pid;
SELECT * FROM "Shipment" ORDER BY shipid;
