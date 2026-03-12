# Clothing POS Database Schema (Multi-Branch)

## Entity Relationship Diagram

```mermaid
erDiagram
    branches ||--o{ users : "employs"
    branches ||--o{ sales : "records"
    branches ||--o{ branch_stock : "holds"
    users ||--o{ sales : "processes"
    products ||--o{ product_variants : "has"
    product_variants ||--o{ branch_stock : "stocked at"
    sales ||--o{ sale_items : "contains"
    product_variants ||--o{ sale_items : "included in"

    branches {
        INT id PK
        VARCHAR(150) name
        TEXT address
        VARCHAR(20) phone
        BOOLEAN is_active
        TIMESTAMP created_at
    }

    users {
        INT id PK
        VARCHAR(100) name
        VARCHAR(100) email
        VARCHAR(255) password
        ENUM role "admin, employee"
        INT branch_id FK
        TIMESTAMP created_at
    }

    products {
        INT id PK
        VARCHAR(150) name
        ENUM category "Men, Women, Kids"
        VARCHAR(100) brand
        TEXT description
        TIMESTAMP created_at
    }

    product_variants {
        INT id PK
        INT product_id FK
        ENUM size "XS, S, M, L, XL, XXL"
        VARCHAR(50) color
        DECIMAL(10,2) cost_price
        DECIMAL(10,2) selling_price
        VARCHAR(100) sku
    }

    branch_stock {
        INT id PK
        INT branch_id FK
        INT variant_id FK
        INT stock_quantity
    }

    sales {
        INT id PK
        VARCHAR(50) invoice_number
        DECIMAL(10,2) total_amount
        ENUM payment_method "cash, card, other"
        INT sold_by FK
        INT branch_id FK
        TIMESTAMP created_at
    }

    sale_items {
        INT id PK
        INT sale_id FK
        INT variant_id FK
        INT quantity
        DECIMAL(10,2) price
        DECIMAL(10,2) subtotal
    }
```

## Tables Details

### `branches`
| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | | Unique identifier for a branch |
| `name` | VARCHAR(150) | NOT NULL | | Name of the branch |
| `address` | TEXT | | | Physical address |
| `phone` | VARCHAR(20) | | | Contact phone number |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Whether the branch is active |
| `created_at` | TIMESTAMP | | CURRENT_TIMESTAMP | Branch creation time |

### `users`
| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | | Unique identifier for a user |
| `name` | VARCHAR(100) | NOT NULL | | Full name of the user |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE | | Email address (used for login) |
| `password` | VARCHAR(255) | NOT NULL | | Hashed password |
| `role` | ENUM | NOT NULL | 'employee' | Role of the user (`admin` or `employee`) |
| `branch_id` | INT | FOREIGN KEY | | References `branches(id)` — assigned branch |
| `created_at` | TIMESTAMP | | CURRENT_TIMESTAMP | Account creation time |

### `products`
| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | | Unique identifier for a product |
| `name` | VARCHAR(150) | NOT NULL | | Name of the product |
| `category` | ENUM | NOT NULL | | Category (`Men`, `Women`, `Kids`) |
| `brand` | VARCHAR(100) | | | Brand of the product |
| `description` | TEXT | | | Detailed description |
| `created_at` | TIMESTAMP | | CURRENT_TIMESTAMP | Product creation time |

### `product_variants`
| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | | Unique identifier for a variant |
| `product_id` | INT | FOREIGN KEY | | References `products(id)` ON DELETE CASCADE |
| `size` | ENUM | NOT NULL | | Size (`XS`, `S`, `M`, `L`, `XL`, `XXL`) |
| `color` | VARCHAR(50) | NOT NULL | | Color of the variant |
| `cost_price` | DECIMAL(10, 2) | NOT NULL | 0.00 | Cost price to the business |
| `selling_price`| DECIMAL(10, 2) | NOT NULL | 0.00 | Selling price to the customer |
| `sku` | VARCHAR(100) | UNIQUE | | Stock Keeping Unit |

### `branch_stock`
| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | | Unique identifier |
| `branch_id` | INT | FOREIGN KEY, UNIQUE(branch_id, variant_id) | | References `branches(id)` |
| `variant_id` | INT | FOREIGN KEY | | References `product_variants(id)` ON DELETE CASCADE |
| `stock_quantity`| INT | NOT NULL | 0 | Current stock level at this branch |

### `sales`
| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | | Unique identifier for a sale |
| `invoice_number`| VARCHAR(50) | NOT NULL, UNIQUE| | Unique invoice identifier |
| `total_amount` | DECIMAL(10, 2) | NOT NULL | 0.00 | Total sale amount |
| `payment_method`| ENUM | NOT NULL | 'cash' | Payment method (`cash`, `card`, `other`) |
| `sold_by` | INT | FOREIGN KEY | | References `users(id)` |
| `branch_id` | INT | FOREIGN KEY | | References `branches(id)` — branch where sale occurred |
| `created_at` | TIMESTAMP | | CURRENT_TIMESTAMP | Time of the sale |

### `sale_items`
| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | | Unique identifier for the sale item line |
| `sale_id` | INT | FOREIGN KEY | | References `sales(id)` ON DELETE CASCADE |
| `variant_id` | INT | FOREIGN KEY | | References `product_variants(id)` |
| `quantity` | INT | NOT NULL | 1 | Quantity of the variant sold |
| `price` | DECIMAL(10, 2) | NOT NULL | | Price per unit at time of sale |
| `subtotal` | DECIMAL(10, 2) | NOT NULL | | `quantity` * `price` |
