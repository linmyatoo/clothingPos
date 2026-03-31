import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Handle 401 globally
API.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;
        // Don't redirect if the error is from the login endpoint itself
        if (error.response && error.response.status === 401 && originalRequest.url !== '/auth/login') {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Employees
export const getEmployees = () => API.get('/auth/employees');
export const createEmployee = (data) => API.post('/auth/employees', data);
export const updateEmployee = (id, data) => API.put(`/auth/employees/${id}`, data);
export const deleteEmployee = (id) => API.delete(`/auth/employees/${id}`);

// Products
export const getProducts = (branchId) => API.get('/products', { params: branchId ? { branch_id: branchId } : {} });
export const getProduct = (id, branchId) => API.get(`/products/${id}`, { params: branchId ? { branch_id: branchId } : {} });
export const createProduct = (data) => API.post('/products', data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);
export const addVariant = (productId, data) => API.post(`/products/${productId}/variants`, data);
export const updateVariant = (variantId, data) => API.put(`/products/variants/${variantId}`, data);
export const getLowStock = (branchId) => API.get('/products/low-stock', { params: branchId ? { branch_id: branchId } : {} });
export const uploadProductImage = (productId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    // Upload through the Next.js proxy (same origin = no CORS issues).
    // Frontend compresses images to <1MB before calling this, so the
    // HTTPS streaming issue that originally caused a direct-to-backend
    // bypass is no longer a problem.
    return API.post(`/products/${productId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// Sales
export const createSale = (data) => API.post('/sales', data);
export const getSales = (branchId) => API.get('/sales', { params: branchId ? { branch_id: branchId } : {} });
export const getSale = (id) => API.get(`/sales/${id}`);

// Reports
export const getDashboardStats = (branchId) => API.get('/reports/dashboard', { params: branchId ? { branch_id: branchId } : {} });
export const getPerformance = (branchId) => API.get('/reports/performance', { params: branchId ? { branch_id: branchId } : {} });
export const getDailyReport = (date, branchId) => API.get('/reports/daily', { params: { date, ...(branchId ? { branch_id: branchId } : {}) } });
export const getMonthlyReport = (year, month, branchId) => API.get('/reports/monthly', { params: { year, month, ...(branchId ? { branch_id: branchId } : {}) } });
export const getYearlyReport = (year, branchId) => API.get('/reports/yearly', { params: { year, ...(branchId ? { branch_id: branchId } : {}) } });

// Branches
export const getBranches = () => API.get('/branches');
export const getBranch = (id) => API.get(`/branches/${id}`);
export const createBranch = (data) => API.post('/branches', data);
export const updateBranch = (id, data) => API.put(`/branches/${id}`, data);
export const deleteBranch = (id) => API.delete(`/branches/${id}`);
export const getBranchStock = (branchId) => API.get(`/branches/${branchId}/stock`);
export const updateBranchStock = (branchId, variantId, data) => API.put(`/branches/${branchId}/stock/${variantId}`, data);

export default API;
