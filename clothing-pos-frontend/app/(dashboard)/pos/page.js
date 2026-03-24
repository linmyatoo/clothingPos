'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProducts, createSale, getDailyReport } from '../../../services/api';
import Cart from '../../../components/Cart';
import { useLanguage } from '../../../context/LanguageContext';

function POS() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [loading, setLoading] = useState(true);
    const [checkoutMsg, setCheckoutMsg] = useState('');
    const [checkoutError, setCheckoutError] = useState('');
    const [todayStats, setTodayStats] = useState({ transactions: 0, revenue: 0, sales: [] });
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const { t } = useLanguage();

    // Helper to securely proxy images over HTTPS by stripping forcing a relative Next.js path
    const getSecureImageUrl = (url) => {
        if (!url) return '';
        const match = url.match(/(\/product-images\/.*)/);
        return match ? match[1] : url;
    };

    useEffect(() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            setUser(u);
        } catch (e) { }
    }, []);

    useEffect(() => {
        if (user) {
            fetchProducts();
            fetchTodayStats();
        }
    }, [user]);

    useEffect(() => {
        let result = products;

        // Only show products that have at least one variant with stock at this branch
        result = result.filter((p) => {
            const variants = p.Variants || p.variants || [];
            const parsed = typeof variants === 'string' ? JSON.parse(variants) : variants;
            return parsed.some(v => v.stock_quantity > 0);
        });

        if (category !== 'All') {
            result = result.filter((p) => p.category === category);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (p) => p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q))
            );
        }
        setFilteredProducts(result);
    }, [products, search, category]);

    const fetchProducts = async () => {
        try {
            const res = await getProducts(user?.branch_id || null);
            setProducts(res.data);
        } catch (err) {
            console.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const fetchTodayStats = async () => {
        try {
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const res = await getDailyReport(today, user?.branch_id || null);
            if (res.data?.summary) {
                setTodayStats({
                    transactions: res.data.summary.total_transactions || 0,
                    revenue: res.data.summary.total_revenue || 0,
                    sales: res.data.sales || []
                });
            }
        } catch (err) {
            console.error('Failed to fetch today stats:', err.response?.data || err.message);
        }
    };

    const handleAddToCart = (product, variant) => {
        setCartItems((prev) => {
            const existing = prev.find((i) => i.variant.id === variant.id);
            if (existing) {
                return prev.map((i) =>
                    i.variant.id === variant.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { product, variant, quantity: 1 }];
        });
    };

    const handleUpdateQty = (variantId, qty) => {
        if (qty <= 0) {
            handleRemove(variantId);
            return;
        }
        setCartItems((prev) =>
            prev.map((i) => (i.variant.id === variantId ? { ...i, quantity: qty } : i))
        );
    };

    const handleRemove = (variantId) => {
        setCartItems((prev) => prev.filter((i) => i.variant.id !== variantId));
    };

    const executeCheckout = async () => {
        if (cartItems.length === 0) return;
        setCheckoutMsg('');
        setCheckoutError('');
        setIsProcessing(true);

        try {
            const items = cartItems.map((i) => ({
                variant_id: i.variant.id,
                quantity: i.quantity,
            }));

            const res = await createSale({ items, payment_method: paymentMethod });
            setCheckoutMsg(`Sale complete! Invoice: ${res.data.invoice_number}`);
            setCartItems([]);
            setIsCartOpen(false);
            setShowConfirmModal(false);
            fetchProducts();
            fetchTodayStats();

            // clear msg after 3s
            setTimeout(() => setCheckoutMsg(''), 3000);
        } catch (err) {
            setCheckoutError(err.response?.data?.message || 'Checkout failed');
            setTimeout(() => setCheckoutError(''), 3000);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full bg-background-light overflow-hidden">
                {/* Modern POS Header overlay */}
                <div className="flex-none px-6 py-4 space-y-4 bg-background-light/95 backdrop-blur-sm z-10 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-6">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Register</h2>
                            {user?.branch_name && (
                                <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">store</span>
                                    {user.branch_name}
                                </span>
                            )}
                            <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
                                <span className="text-sm font-medium text-slate-500">
                                    Today's Sales: <span className="font-bold text-slate-900 ml-1">{todayStats.transactions}</span>
                                </span>
                                <span className="text-sm font-medium text-slate-500">
                                    Revenue: <span className="font-bold text-emerald-600 ml-1">${parseFloat(todayStats.revenue).toFixed(2)}</span>
                                </span>
                                <button onClick={() => setShowHistoryModal(true)} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors ml-4 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                    <span className="material-symbols-outlined text-[18px]">history</span>
                                    History
                                </button>
                                {user?.role === 'employee' && (
                                    <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-white hover:bg-red-500 transition-colors ml-2 bg-white px-3 py-1.5 rounded-lg border border-red-200 shadow-sm">
                                        <span className="material-symbols-outlined text-[18px]">logout</span>
                                        Logout
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    {checkoutMsg && (
                        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg border border-emerald-200 flex items-center gap-2 shadow-sm text-sm">
                            <span className="material-symbols-outlined">check_circle</span>
                            {checkoutMsg}
                        </div>
                    )}
                    {checkoutError && (
                        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200 flex items-center gap-2 shadow-sm text-sm">
                            <span className="material-symbols-outlined">error</span>
                            {checkoutError}
                        </div>
                    )}
                    <div className="flex gap-4 mb-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </div>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="block w-full pl-10 pr-12 py-3 border-none rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary shadow-sm text-base"
                                placeholder="Search products by name or brand..."
                                type="text"
                            />
                            <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                                <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">barcode_scanner</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {['All', 'Men', 'Women', 'Kids'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`flex-none px-5 py-2.5 rounded-full text-sm font-medium transition-all ${category === cat ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" : "bg-white text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-primary/50"}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid Area */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-4 animate-spin">refresh</span>
                            <p>Loading products...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-4">inventory_2</span>
                            <p>No products found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {filteredProducts.map((product) => {
                                // Defaulting to the first variant or showing multiple cards for variants.
                                // The original code reused ProductCard which handled variant selection differently.
                                // In the new design, adding to cart should be quick. Let's show the first variant.
                                const variant = product.Variants?.[0];
                                if (!variant) return null;

                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => handleAddToCart(product, variant)}
                                        className="group bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-primary/20 flex flex-col"
                                    >
                                        <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-slate-100 mb-3 flex items-center justify-center">
                                            {product.image_url ? (
                                                <img src={getSecureImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-5xl text-slate-300">checkroom</span>
                                            )}
                                            <button className="absolute bottom-2 right-2 h-8 w-8 bg-white rounded-full shadow-md flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                                <span className="material-symbols-outlined text-[20px]">add</span>
                                            </button>
                                        </div>
                                        <h3 className="font-semibold text-slate-900 text-sm mb-1 truncate">{product.name}</h3>
                                        <div className="mt-auto flex items-center justify-between">
                                            <p className="text-slate-500 text-xs truncate max-w-[80px]">{product.brand || 'No Brand'}</p>
                                            <p className="font-bold text-primary text-sm">${parseFloat(variant.selling_price).toFixed(2)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Cart Button */}
            {!isCartOpen && (
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] shadow-primary/50 flex items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-primary/60 transition-all z-40 group border-2 border-white/20"
                >
                    <div className="relative flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                        {cartItems.length > 0 && (
                            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[11px] font-bold min-w-[24px] h-[24px] px-1.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                            </span>
                        )}
                    </div>
                    {cartItems.length > 0 && (
                        <div className="flex flex-col items-start pr-2 pl-1 border-l border-white/20 ml-1">
                            <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider leading-none mb-1">Checkout</span>
                            <span className="font-bold text-lg leading-none">
                                ${cartItems.reduce((acc, i) => acc + i.variant.selling_price * i.quantity, 0).toFixed(2)}
                            </span>
                        </div>
                    )}
                </button>
            )}

            {/* Right Side Cart Overlay */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}>
                    <div className="h-full w-full max-w-[400px] bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <Cart
                            cartItems={cartItems}
                            onUpdateQty={handleUpdateQty}
                            onRemove={handleRemove}
                            onCheckout={() => setShowConfirmModal(true)}
                            paymentMethod={paymentMethod}
                            setPaymentMethod={setPaymentMethod}
                            onClose={() => setIsCartOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Checkout Confirm Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Confirm Order</h3>
                                <p className="text-slate-500 text-sm mt-1">Review items before finalizing</p>
                            </div>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                                disabled={isProcessing}
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="overflow-auto p-6 flex-1">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="text-slate-400 border-b border-slate-100">
                                        <th className="pb-3 font-medium">Item</th>
                                        <th className="pb-3 font-medium">Variant</th>
                                        <th className="pb-3 font-medium text-center">Qty</th>
                                        <th className="pb-3 font-medium text-right">Price</th>
                                        <th className="pb-3 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {cartItems.map((item) => (
                                        <tr key={item.variant.id}>
                                            <td className="py-4 font-medium text-slate-900">{item.product.name}</td>
                                            <td className="py-4 text-slate-500">{item.variant.size} {item.variant.color ? `/ ${item.variant.color}` : ''}</td>
                                            <td className="py-4 text-center text-slate-700">{item.quantity}</td>
                                            <td className="py-4 text-right text-slate-700">${parseFloat(item.variant.selling_price).toFixed(2)}</td>
                                            <td className="py-4 text-right font-bold text-slate-900">
                                                ${(parseFloat(item.variant.selling_price) * item.quantity).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-slate-100">
                                        <td colSpan="4" className="py-4 text-right font-bold text-slate-900">Total Amount:</td>
                                        <td className="py-4 text-right font-bold text-primary text-lg">
                                            ${cartItems.reduce((acc, i) => acc + i.variant.selling_price * i.quantity, 0).toFixed(2)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="4" className="py-2 text-right font-bold text-slate-900">Payment Method:</td>
                                        <td className="py-2 text-right font-bold text-slate-700 capitalize">
                                            {paymentMethod}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={isProcessing}
                                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeCheckout}
                                disabled={isProcessing}
                                className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium shadow-md shadow-primary/20 hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isProcessing && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                                Confirm & Charge
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{t('todays_transactions')}</h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    {todayStats.transactions} {t('orders_totaling')} ${parseFloat(todayStats.revenue).toFixed(2)}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="overflow-auto p-6 flex-1">
                            {todayStats.sales.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-3 opacity-50">receipt_long</span>
                                    <p>No transactions today yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead>
                                            <tr className="text-slate-400 border-b border-slate-100">
                                                <th className="pb-3 font-medium">Invoice No.</th>
                                                <th className="pb-3 font-medium">Time</th>
                                                <th className="pb-3 font-medium">Cashier</th>
                                                <th className="pb-3 font-medium">Payment</th>
                                                <th className="pb-3 font-medium text-right">Amount</th>
                                                <th className="pb-3 font-medium text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {todayStats.sales.map((sale) => (
                                                <tr key={sale.id} className="group hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 font-medium text-slate-900">#{sale.invoice_number}</td>
                                                    <td className="py-4 text-slate-500">
                                                        {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="py-4 text-slate-700">{sale.cashier_name}</td>
                                                    <td className="py-4 text-slate-700 capitalize">{sale.payment_method}</td>
                                                    <td className="py-4 text-right font-bold text-slate-900">
                                                        ${parseFloat(sale.total_amount).toFixed(2)}
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">
                                                            Paid
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default POS;
