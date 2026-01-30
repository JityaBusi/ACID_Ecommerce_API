-- USERS
INSERT INTO users (email, password)
VALUES
  ('testuser1@example.com', 'hashedpassword1'),
  ('testuser2@example.com', 'hashedpassword2');

-- PRODUCTS
INSERT INTO products (name, price, stock)
VALUES
  ('Laptop', 75000.00, 5),
  ('Phone', 30000.00, 10),
  ('Headphones', 2500.00, 15),
  ('Keyboard', 1500.00, 0),
  ('Mouse', 800.00, 20);
