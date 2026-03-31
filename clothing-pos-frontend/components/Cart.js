'use client';

import React from 'react';

function Cart({ cartItems, onUpdateQty, onRemove, onCheckout, paymentMethod, setPaymentMethod, onClose }) {
    const subtotal = cartItems.reduce((sum, item) => sum + item.variant.selling_price * item.quantity, 0);
    const total = subtotal;

    // Helper to securely proxy HTTP images over HTTPS via Next.js
    const getSecureImageUrl = (url) => {
        if (!url) return '';
        const match = url.match(/(\/product-images\/.*)/);
        return match ? match[1] : url;
    };

    const getCartImage = (product) => {
        if (product.image_url) return getSecureImageUrl(product.image_url);
        return "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=150&q=80";
    };

    return (
        <aside className="w-full flex-none bg-white border-l border-slate-100 flex flex-col h-full shadow-xl z-20">
            <div className="flex-none p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Current Order</h2>
                    <p className="text-sm text-slate-500">Order Walk-in Customer</p>
                </div>
                <div className="flex items-center gap-2">
                    {cartItems.length > 0 && (
                        <button
                            onClick={() => cartItems.forEach(i => onRemove(i.variant.id))}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center justify-center"
                            title="Clear Cart"
                        >
                            <span className="material-symbols-outlined">delete_sweep</span>
                        </button>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors flex items-center justify-center"
                            title="Close Cart"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2">shopping_bag</span>
                        <p>Cart is empty</p>
                        <small className="text-xs">Select products from the grid</small>
                    </div>
                ) : (
                    cartItems.map((item) => (
                        <div key={item.variant.id} className="flex gap-3 bg-background-light p-3 rounded-xl group relative">
                            {/* Product Image */}
                            <div className="size-16 rounded-lg bg-slate-200 bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${getCartImage(item.product)}')` }}></div>

                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-slate-900 text-sm leading-tight max-w-[140px] truncate">{item.product.name}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Size: {item.variant.size} • Color: {item.variant.color}</p>
                                    </div>
                                    <p className="font-bold text-slate-900 text-sm">{(parseFloat(item.variant.selling_price) * item.quantity).toFixed(2)} MMK</p>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center bg-white rounded-lg border border-slate-200 h-7">
                                        <button onClick={() => onUpdateQty(item.variant.id, item.quantity - 1)} className="w-7 h-full flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>remove</span>
                                        </button>
                                        <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                                        <button onClick={() => onUpdateQty(item.variant.id, item.quantity + 1)} className="w-7 h-full flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                                        </button>
                                    </div>
                                    <span className="text-xs text-slate-500">{parseFloat(item.variant.selling_price).toFixed(2)} MMK/ea</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>


            <div className="flex-none bg-white p-5 pt-3 border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span>{subtotal.toFixed(2)} MMK</span>
                    </div>
                    <div className="flex justify-between items-end pt-2">
                        <span className="text-base font-bold text-slate-900">Total</span>
                        <span className="text-2xl font-bold text-slate-900">{total.toFixed(2)} MMK</span>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                    <button
                        onClick={() => setPaymentMethod('card')}
                        className={`col-span-1 flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${paymentMethod === 'card' ? 'bg-primary/10 border-primary border text-primary' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
                    >
                        <span className="material-symbols-outlined mb-1" style={{ fontSize: '20px' }}>credit_card</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide">Card</span>
                    </button>
                    <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`col-span-1 flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${paymentMethod === 'cash' ? 'bg-primary/10 border-primary border text-primary' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
                    >
                        <span className="material-symbols-outlined mb-1" style={{ fontSize: '20px' }}>payments</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide">Cash</span>
                    </button>
                    <button
                        onClick={() => setPaymentMethod('qr')}
                        className={`col-span-1 flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${paymentMethod === 'qr' ? 'bg-primary/10 border-primary border text-primary' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
                    >
                        <span className="material-symbols-outlined mb-1" style={{ fontSize: '20px' }}>qr_code_scanner</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide">QR</span>
                    </button>
                    <button
                        onClick={() => setPaymentMethod('other')}
                        className={`col-span-1 flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${paymentMethod === 'other' ? 'bg-primary/10 border-primary border text-primary' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
                    >
                        <span className="material-symbols-outlined mb-1" style={{ fontSize: '20px' }}>more_horiz</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide">More</span>
                    </button>
                </div>
                <button
                    onClick={onCheckout}
                    disabled={cartItems.length === 0}
                    className="w-full bg-primary hover:bg-blue-600 disabled:bg-slate-300 disabled:shadow-none text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-between group"
                >
                    <span className="text-lg">Charge</span>
                    <div className="flex items-center gap-2">
                        <span className="text-lg opacity-90">{total.toFixed(2)} MMK</span>
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                </button>
            </div>
        </aside>
    );
}

export default Cart;
