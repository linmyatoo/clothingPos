# Clothing POS API Documentation

Base URL: `http://localhost:5001/api`

## Authentication

| Method | Endpoint | Description | Auth Required | Role |
| :--- | :--- | :--- | :---: | :---: |
| POST | `/auth/login` | Login and get JWT token | No | - |
| GET | `/auth/me` | Get current user details | Yes | Any |

## Employee Management

| Method | Endpoint | Description | Auth Required | Role |
| :--- | :--- | :--- | :---: | :---: |
| GET | `/auth/employees` | List all employees | Yes | Admin |
| POST | `/auth/employees` | Create new employee | Yes | Admin |
| PUT | `/auth/employees/:id` | Update employee details | Yes | Admin |
| DELETE | `/auth/employees/:id` | Delete employee | Yes | Admin |

## Branches

| Method | Endpoint | Description | Auth Required | Role |
| :--- | :--- | :--- | :---: | :---: |
| GET | `/branches` | List all branches | Yes | Any |
| GET | `/branches/:id` | Get branch details | Yes | Any |
| POST | `/branches` | Create new branch | Yes | Admin |
| PUT | `/branches/:id` | Update branch details | Yes | Admin |
| DELETE | `/branches/:id` | Delete branch | Yes | Admin |
| GET | `/branches/:branchId/stock` | Get stock for a branch | Yes | Any |
| PUT | `/branches/:branchId/stock/:variantId` | Update stock quantity | Yes | Admin |

## Products

| Method | Endpoint | Description | Auth Required | Role |
| :--- | :--- | :--- | :---: | :---: |
| GET | `/products` | List all products | Yes | Any |
| GET | `/products/:id` | Get product details | Yes | Any |
| POST | `/products` | Create new product | Yes | Admin |
| PUT | `/products/:id` | Update product details | Yes | Admin |
| DELETE | `/products/:id` | Delete product | Yes | Admin |
| POST | `/products/:id/variants` | Add product variant | Yes | Admin |
| PUT | `/products/variants/:variantId` | Update variant details | Yes | Admin |
| POST | `/products/:id/image` | Upload product image | Yes | Admin |
| GET | `/products/low-stock` | Get low stock alert | Yes | Admin |

## Sales

| Method | Endpoint | Description | Auth Required | Role |
| :--- | :--- | :--- | :---: | :---: |
| POST | `/sales` | Create a new sale | Yes | Any |
| GET | `/sales` | List all sales | Yes | Any |
| GET | `/sales/:id` | Get sale details | Yes | Any |

## Reports

| Method | Endpoint | Description | Auth Required | Role |
| :--- | :--- | :--- | :---: | :---: |
| GET | `/reports/dashboard` | Dashboard summary stats | Yes | Admin |
| GET | `/reports/daily` | Daily sales report | Yes | Admin, Employee |
| GET | `/reports/monthly` | Monthly sales report | Yes | Admin |
| GET | `/reports/yearly` | Yearly sales report | Yes | Admin |
| GET | `/reports/performance` | Branch performance | Yes | Admin |

---

## Request/Response Format

### Headers
All authenticated requests must include the following header:
`Authorization: Bearer <your_jwt_token>`

### Success Response
Standard success responses return a JSON object or array with status 200 (OK) or 201 (Created).

### Error Response
Errors follow a consistent structure:
```json
{
  "message": "Error description"
}
```
Common status codes:
- `400 Bad Request`: Missing or invalid parameters.
- `401 Unauthorized`: Missing or invalid JWT token.
- `403 Forbidden`: User does not have the required role.
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Resource already exists (e.g., duplicate email).
- `500 Internal Server Error`: Unexpected server error.
