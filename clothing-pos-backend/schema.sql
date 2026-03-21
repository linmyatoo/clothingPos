-- Clothing POS Database Schema (Multi-Branch)
CREATE DATABASE IF NOT EXISTS clothing_pos;
USE clothing_pos;

CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
  branch_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category ENUM('Men', 'Women', 'Kids') NOT NULL,
  brand VARCHAR(100),
  description TEXT,
  image_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  size ENUM('XS', 'S', 'M', 'L', 'XL', 'XXL') NOT NULL,
  color VARCHAR(50) NOT NULL,
  cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  sku VARCHAR(100) UNIQUE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS branch_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  variant_id INT NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  UNIQUE KEY uq_branch_variant (branch_id, variant_id)
);

CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  payment_method ENUM('cash', 'card', 'other') NOT NULL DEFAULT 'cash',
  sold_by INT NOT NULL,
  branch_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sold_by) REFERENCES users(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  variant_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- Default branch
INSERT INTO branches (name, address, phone) VALUES ('Main Branch', 'Default Address', '000-000-0000');

-- Default admin user (password: admin123)
INSERT INTO users (name, email, password, role, branch_id) VALUES
('Admin User', 'admin@clothingpos.com', '$2a$10$lKjAs3vMQ/5Q7ebRJ978TOMeb8JTe3dfr1xkuaveHNrhUAt90RHO.', 'admin', 1);
