'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBranches, getBranchStock, updateBranchStock } from '../../../../services/api';

function BranchStock() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const branchIdParam = searchParams.get('branch');

    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(branchIdParam || '');
    const [stockItems, setStockItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [editQty, setEditQty] = useState('');
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (selectedBranch) fetchStock();
    }, [selectedBranch]);

    useEffect(() => {
        if (successMsg) { const t = setTimeout(() => setSuccessMsg(''), 3000); return () => clearTimeout(t); }
    }, [successMsg]);

    const fetchBranches = async () => {
        try {
            const res = await getBranches();
            setBranches(res.data);
            if (!selectedBranch && res.data.length > 0) {
                setSelectedBranch(String(res.data[0].id));
            }
        } catch (err) {
            console.error('Failed to fetch branches:', err);
        }
    };

    const fetchStock = async () => {
        setLoading(true);
        try {
            const res = await getBranchStock(selectedBranch);
            setStockItems(res.data);
        } catch (err) {
            console.error('Failed to fetch stock:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setEditQty(String(item.stock_quantity));
    };

    const handleSave = async () => {
        if (!editingItem) return;
        setSaving(true);
        try {
            await updateBranchStock(selectedBranch, editingItem.variant_id, {
                stock_quantity: parseInt(editQty, 10) || 0,
            });
            setSuccessMsg(`Stock updated for ${editingItem.product_name} (${editingItem.size}/${editingItem.color})`);
            setEditingItem(null);
            fetchStock();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update stock');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditingItem(null);
        setEditQty('');
    };

    const categories = ['All', ...new Set(stockItems.map(i => i.category).filter(Boolean))];

    const filtered = stockItems.filter(item => {
        const matchSearch = !searchTerm ||
            item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.color?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;
        return matchSearch && matchCategory;
    });

    const branchName = branches.find(b => String(b.id) === String(selectedBranch))?.name || 'Branch';
    const totalVariants = filtered.length;
    const inStockCount = filtered.filter(i => i.stock_quantity > 0).length;
    const outOfStockCount = filtered.filter(i => i.stock_quantity === 0).length;
    const lowStockCount = filtered.filter(i => i.stock_quantity > 0 && i.stock_quantity <= 5).length;

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-5 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <Link href="/branches" className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all">
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Branch Stock Manager</h2>
                        <p className="text-sm text-slate-500">Manage inventory for each branch location.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-primary focus:border-primary shadow-sm min-w-[200px]"
                    >
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={fetchStock}
                        className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary transition-all shadow-sm"
                        title="Refresh"
                    >
                        <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                </div>
            </header>

            {/* Success Message */}
            {successMsg && (
                <div className="mx-8 mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200 flex items-center gap-2 animate-fade-in">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    {successMsg}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8 pt-6">
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Items</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{totalVariants}</p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-sm">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">In Stock</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{inStockCount}</p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-sm">
                    <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Low Stock (≤5)</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{lowStockCount}</p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-sm">
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wider">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{outOfStockCount}</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="px-8 pt-4 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[250px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">search</span>
                    <input
                        type="text"
                        placeholder="Search by product, SKU, size, color..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${categoryFilter === cat
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-primary/50 hover:text-primary'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stock Table */}
            <div className="flex-1 px-8 py-4 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-48 text-slate-400">
                        <span className="material-symbols-outlined text-3xl animate-spin mr-3">refresh</span>
                        Loading stock...
                    </div>
                ) : !selectedBranch ? (
                    <div className="text-center py-16 text-slate-400">
                        <span className="material-symbols-outlined text-5xl mb-3 opacity-50 block">store</span>
                        <p className="text-lg">Select a branch to manage stock</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <span className="material-symbols-outlined text-5xl mb-3 opacity-50 block">inventory_2</span>
                        <p className="text-lg">No products found</p>
                        <p className="text-sm mt-1">Add products in the Products page first.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Variant</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">SKU</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Price</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Stock</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((item) => {
                                    const isEditing = editingItem?.variant_id === item.variant_id;
                                    const stockLevel = item.stock_quantity === 0 ? 'out' : item.stock_quantity <= 5 ? 'low' : 'ok';
                                    return (
                                        <tr key={item.variant_id} className={`hover:bg-slate-50/50 transition-colors ${isEditing ? 'bg-blue-50/30' : ''}`}>
                                            <td className="px-5 py-3">
                                                <span className="font-semibold text-slate-900 text-sm">{item.product_name}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    {item.color && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
                                                            {item.color}
                                                        </span>
                                                    )}
                                                    {item.size && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
                                                            {item.size}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-xs text-slate-500 font-mono">{item.sku || '—'}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-sm text-slate-600">{item.category || '—'}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-sm font-medium text-slate-900">
                                                    {Number(item.selling_price).toLocaleString()} Ks
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={editQty}
                                                        onChange={(e) => setEditQty(e.target.value)}
                                                        className="w-20 px-2 py-1 border border-primary rounded-lg text-sm text-center focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSave();
                                                            if (e.key === 'Escape') handleCancel();
                                                        }}
                                                    />
                                                ) : (
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold ${stockLevel === 'out' ? 'bg-red-50 text-red-700' :
                                                        stockLevel === 'low' ? 'bg-amber-50 text-amber-700' :
                                                            'bg-emerald-50 text-emerald-700'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${stockLevel === 'out' ? 'bg-red-500' :
                                                            stockLevel === 'low' ? 'bg-amber-500' :
                                                                'bg-emerald-500'
                                                            }`}></span>
                                                        {item.stock_quantity}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <button
                                                            onClick={handleSave}
                                                            disabled={saving}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-blue-600 transition-all disabled:opacity-50"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">check</span>
                                                            {saving ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button
                                                            onClick={handleCancel}
                                                            className="flex items-center px-2 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-primary hover:bg-blue-50 transition-all ml-auto"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                        Edit
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

export default BranchStock;
