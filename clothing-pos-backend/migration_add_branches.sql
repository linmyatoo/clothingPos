-- ============================================
-- Migration: Add Multi-Branch Support
-- Run this against an existing clothing_pos DB
-- ============================================

USE clothing_pos;

-- 1. Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert default "Main Branch" for existing data
INSERT INTO branches (name, address, phone) VALUES ('Main Branch', 'Default Address', '000-000-0000');

-- 3. Add branch_id to users
ALTER TABLE users ADD COLUMN branch_id INT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id);

-- 4. Assign all existing users to Main Branch (id=1)
UPDATE users SET branch_id = 1;

-- 5. Add branch_id to sales
ALTER TABLE sales ADD COLUMN branch_id INT NULL;
ALTER TABLE sales ADD CONSTRAINT fk_sales_branch FOREIGN KEY (branch_id) REFERENCES branches(id);

-- 6. Assign all existing sales to Main Branch
UPDATE sales SET branch_id = 1;

-- 7. Create branch_stock table (per-branch inventory)
CREATE TABLE IF NOT EXISTS branch_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  variant_id INT NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  UNIQUE KEY uq_branch_variant (branch_id, variant_id)
);

-- 8. Migrate existing stock_quantity from product_variants to branch_stock for Main Branch
INSERT INTO branch_stock (branch_id, variant_id, stock_quantity)
SELECT 1, id, stock_quantity FROM product_variants;

-- 9. Drop stock_quantity column from product_variants
ALTER TABLE product_variants DROP COLUMN stock_quantity;

-- Done!
-- Verify: SELECT * FROM branches;
-- Verify: SELECT * FROM branch_stock;
-- Verify: SELECT branch_id FROM users LIMIT 5;
-- Verify: SELECT branch_id FROM sales LIMIT 5;
