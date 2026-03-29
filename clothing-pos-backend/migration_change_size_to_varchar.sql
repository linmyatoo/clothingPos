-- Migration to change product_variants size column from ENUM to VARCHAR
-- This fixes the error where "Free Size" and other size patterns were rejected

USE clothing_pos;
ALTER TABLE product_variants MODIFY COLUMN size VARCHAR(50) NOT NULL;
