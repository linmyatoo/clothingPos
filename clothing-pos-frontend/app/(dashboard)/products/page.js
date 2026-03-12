'use client';

import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, addVariant, getBranches, updateBranchStock, uploadProductImage } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [expandedProduct, setExpandedProduct] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [editingStock, setEditingStock] = useState(null); // { variantId, branchId, qty }
    const [savingStock, setSavingStock] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const { t } = useLanguage();

    // Form state
    const [formData, setFormData] = useState({
        name: '', category: 'Men', brand: '', description: '',
        variants: [{ size: 'M', color: '', cost_price: '', selling_price: '', stock_quantity: '', sku: '' }]
    });

    useEffect(() => { fetchProducts(); fetchBranches(); }, []);
    useEffect(() => { if (successMsg) { const timer = setTimeout(() => setSuccessMsg(''), 3000); return () => clearTimeout(timer); } }, [successMsg]);

    const fetchBranches = async () => {
        try {
            const res = await getBranches();
            setBranches(res.data.filter(b => b.is_active === 1 || b.is_active === true));
        } catch (err) { console.error('Failed to fetch branches:', err); }
    };

    const handleStockEdit = (variantId, branchId, currentQty) => {
        setEditingStock({ variantId, branchId, qty: String(currentQty) });
    };

    const handleStockSave = async () => {
        if (!editingStock) return;
        setSavingStock(true);
        try {
            await updateBranchStock(editingStock.branchId, editingStock.variantId, {
                stock_quantity: parseInt(editingStock.qty, 10) || 0,
            });
            setSuccessMsg('Stock updated!');
            setEditingStock(null);
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update stock');
        } finally {
            setSavingStock(false);
        }
    };

    const handleStockCancel = () => setEditingStock(null);

    const fetchProducts = async () => {
        try {
            const res = await getProducts();
            setProducts(res.data);
        } catch (err) { console.error('Failed to fetch products:', err); }
        finally { setLoading(false); }
    };

    // Stats
    const totalProducts = products.length;
    const totalVariants = products.reduce((s, p) => s + (p.Variants?.filter(v => v.id)?.length || 0), 0);
    const lowStock = products.reduce((s, p) => s + (p.Variants?.filter(v => v.id && v.stock_quantity > 0 && v.stock_quantity <= 5)?.length || 0), 0);
    const outOfStock = products.reduce((s, p) => s + (p.Variants?.filter(v => v.id && v.stock_quantity === 0)?.length || 0), 0);

    // Unique categories for filter
    const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

    // Filtered products
    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleOpenAdd = () => {
        setEditingProduct(null);
        setFormData({
            name: '', category: 'Men', brand: '', description: '',
            variants: [{ size: 'M', color: '', cost_price: '', selling_price: '', stock_quantity: '', sku: '' }]
        });
        setImageFile(null);
        setImagePreview(null);
        setFormError('');
        setShowModal(true);
    };

    const handleOpenEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category: product.category,
            brand: product.brand || '',
            description: product.description || '',
            variants: []
        });
        setImageFile(null);
        setImagePreview(product.image_url || null);
        setFormError('');
        setShowModal(true);
    };

    const handleAddVariantRow = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, { size: 'M', color: '', cost_price: '', selling_price: '', stock_quantity: '', sku: '' }]
        }));
    };

    const handleRemoveVariantRow = (idx) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== idx)
        }));
    };

    const handleVariantChange = (idx, field, value) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) => i === idx ? { ...v, [field]: value } : v)
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        try {
            let productId;
            if (editingProduct) {
                await updateProduct(editingProduct.id, {
                    name: formData.name,
                    category: formData.category,
                    brand: formData.brand,
                    description: formData.description,
                });
                productId = editingProduct.id;
                setSuccessMsg(t('product_updated'));
            } else {
                if (!formData.name || !formData.category) {
                    setFormError('Name and category are required.');
                    setFormLoading(false);
                    return;
                }
                const res = await createProduct({
                    name: formData.name,
                    category: formData.category,
                    brand: formData.brand,
                    description: formData.description,
                    variants: formData.variants.filter(v => v.selling_price).map(v => ({
                        ...v,
                        cost_price: parseFloat(v.cost_price) || 0,
                        selling_price: parseFloat(v.selling_price) || 0,
                        stock_quantity: parseInt(v.stock_quantity) || 0,
                    })),
                });
                productId = res.data.id;
                setSuccessMsg(t('product_created'));
            }

            // Upload image if selected
            if (imageFile && productId) {
                await uploadProductImage(productId, imageFile);
            }

            setShowModal(false);
            fetchProducts();
        } catch (err) {
            setFormError(err.response?.data?.message || t('operation_failed'));
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}" and all its variants?`)) return;
        try {
            await deleteProduct(id);
            setSuccessMsg(t('product_deleted'));
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete.');
        }
    };

    const getStockBadge = (qty) => {
        if (qty === 0 || qty === null) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10">{t('out_of_stock')}</span>;
        if (qty <= 5) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/10">{qty} {t('low_stock')}</span>;
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10">{qty} {t('in_stock')}</span>;
    };

    const getCategoryColor = (cat) => {
        const map = { Men: 'bg-blue-50 text-blue-700', Women: 'bg-pink-50 text-pink-700', Kids: 'bg-amber-50 text-amber-700' };
        return map[cat] || 'bg-slate-100 text-slate-700';
    };

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-5 backdrop-blur-xl">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-slate-900">{t('product_management')}</h2>
                    <p className="text-sm text-slate-500">{t('manage_catalog')}</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400">search</span>
                        </div>
                        <input
                            className="block w-64 rounded-xl border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-primary shadow-sm transition-all"
                            placeholder="Search products..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>Add Product</span>
                    </button>
                </div>
            </header>

            {/* Success Message */}
            {successMsg && (
                <div className="mx-8 mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    {successMsg}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {/* Category Filter */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all ${categoryFilter === cat ? 'bg-primary text-white shadow-md' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg text-primary">
                                <span className="material-symbols-outlined">inventory_2</span>
                            </div>
                            <p className="text-sm font-medium text-slate-500">Total Products</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{totalProducts}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <span className="material-symbols-outlined">check_circle</span>
                            </div>
                            <p className="text-sm font-medium text-slate-500">Total Variants</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{totalVariants}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                <span className="material-symbols-outlined">warning</span>
                            </div>
                            <p className="text-sm font-medium text-slate-500">Low Stock</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{lowStock}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                <span className="material-symbols-outlined">error</span>
                            </div>
                            <p className="text-sm font-medium text-slate-500">Out of Stock</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{outOfStock}</p>
                    </div>
                </div>

                {/* Product Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 w-[30%]">Product</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 w-[12%]">Category</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 w-[12%]">Brand</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 w-[12%]">Variants</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 w-[14%]">Stock</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right w-[10%]">Price</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right w-[10%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                            <span className="material-symbols-outlined text-3xl animate-spin mr-2">refresh</span>
                                            Loading products...
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50 block">inventory_2</span>
                                            {searchTerm || categoryFilter !== 'All' ? 'No products match your filters.' : 'No products yet. Click "Add Product" to get started.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((product) => {
                                        const variants = product.Variants?.filter(v => v.id) || [];
                                        const totalStock = variants.reduce((s, v) => s + (v.stock_quantity || 0), 0);
                                        const minPrice = variants.length > 0 ? Math.min(...variants.map(v => parseFloat(v.selling_price) || 0)) : 0;
                                        const maxPrice = variants.length > 0 ? Math.max(...variants.map(v => parseFloat(v.selling_price) || 0)) : 0;
                                        const isExpanded = expandedProduct === product.id;

                                        return (
                                            <tr key={product.id} className="group">
                                                {/* Main product row - render as a clickable expandable */}
                                                <td className="py-4 px-6" colSpan="7">
                                                    <div
                                                        className="flex items-center cursor-pointer hover:bg-slate-50/50 -mx-6 -my-4 px-6 py-4 transition-colors"
                                                        onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                                                    >
                                                        {/* Product info */}
                                                        <div className="flex items-center gap-3 w-[30%]">
                                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 shrink-0 overflow-hidden">
                                                                {product.image_url ? (
                                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="material-symbols-outlined text-[20px]">checkroom</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-900">{product.name}</p>
                                                                <p className="text-xs text-slate-500">ID: #{product.id}</p>
                                                            </div>
                                                        </div>
                                                        <div className="w-[12%]">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getCategoryColor(product.category)}`}>
                                                                {product.category}
                                                            </span>
                                                        </div>
                                                        <div className="w-[12%]">
                                                            <span className="text-sm text-slate-600">{product.brand || '—'}</span>
                                                        </div>
                                                        <div className="w-[12%]">
                                                            <span className="text-sm text-slate-600">{variants.length} variant{variants.length !== 1 ? 's' : ''}</span>
                                                        </div>
                                                        <div className="w-[14%]">
                                                            {getStockBadge(totalStock)}
                                                        </div>
                                                        <div className="w-[10%] text-right">
                                                            <span className="text-sm font-semibold text-slate-900">
                                                                {minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)}–$${maxPrice.toFixed(2)}`}
                                                            </span>
                                                        </div>
                                                        <div className="w-[10%] flex justify-end items-center gap-1">
                                                            <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(product); }} className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-all" title="Edit">
                                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(product.id, product.name); }} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
                                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            </button>
                                                            <span className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                                                        </div>
                                                    </div>

                                                    {/* Expanded variants */}
                                                    {isExpanded && (
                                                        <div className="mt-3 ml-12 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Variants & Branch Stock</h4>
                                                            </div>
                                                            {variants.length === 0 ? (
                                                                <p className="text-sm text-slate-500 italic">No variants added yet.</p>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {variants.map((v, idx) => (
                                                                        <div key={v.id || idx} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                                                                            {/* Variant header */}
                                                                            <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-50">
                                                                                <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
                                                                                    <div>
                                                                                        <span className="text-xs text-slate-400 block">Size</span>
                                                                                        <span className="font-medium text-slate-900">{v.size || '—'}</span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-xs text-slate-400 block">Color</span>
                                                                                        <span className="font-medium text-slate-900">{v.color || '—'}</span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-xs text-slate-400 block">Cost</span>
                                                                                        <span className="text-slate-600">${parseFloat(v.cost_price || 0).toFixed(2)}</span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-xs text-slate-400 block">Price</span>
                                                                                        <span className="font-semibold text-slate-900">${parseFloat(v.selling_price || 0).toFixed(2)}</span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-xs text-slate-400 block">Total Stock</span>
                                                                                        {getStockBadge(v.stock_quantity)}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            {/* Branch stock rows */}
                                                                            {branches.length > 0 && (
                                                                                <div className="px-4 py-2 bg-slate-50/50">
                                                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                                                                                        <span className="material-symbols-outlined text-[12px]">store</span>
                                                                                        Stock by Branch
                                                                                    </p>
                                                                                    <div className="space-y-1">
                                                                                        {branches.map(branch => {
                                                                                            const branchStock = v.branch_stocks?.find(bs => bs.branch_id === branch.id);
                                                                                            const qty = branchStock ? branchStock.stock_quantity : 0;
                                                                                            const isEditing = editingStock?.variantId === v.id && editingStock?.branchId === branch.id;
                                                                                            return (
                                                                                                <div key={branch.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/80 transition-colors group/stock">
                                                                                                    <span className="text-xs font-medium text-slate-600">{branch.name}</span>
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        {isEditing ? (
                                                                                                            <>
                                                                                                                <input
                                                                                                                    type="number"
                                                                                                                    min="0"
                                                                                                                    value={editingStock.qty}
                                                                                                                    onChange={(e) => setEditingStock({ ...editingStock, qty: e.target.value })}
                                                                                                                    className="w-16 px-2 py-0.5 border border-primary rounded-md text-xs text-center focus:ring-1 focus:ring-primary"
                                                                                                                    autoFocus
                                                                                                                    onKeyDown={(e) => {
                                                                                                                        if (e.key === 'Enter') handleStockSave();
                                                                                                                        if (e.key === 'Escape') handleStockCancel();
                                                                                                                    }}
                                                                                                                />
                                                                                                                <button onClick={handleStockSave} disabled={savingStock} className="p-0.5 rounded text-primary hover:bg-primary/10 transition-colors">
                                                                                                                    <span className="material-symbols-outlined text-[14px]">check</span>
                                                                                                                </button>
                                                                                                                <button onClick={handleStockCancel} className="p-0.5 rounded text-slate-400 hover:bg-slate-100 transition-colors">
                                                                                                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                                                                                                </button>
                                                                                                            </>
                                                                                                        ) : (
                                                                                                            <>
                                                                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${qty === 0 ? 'bg-red-50 text-red-700' :
                                                                                                                    qty <= 5 ? 'bg-amber-50 text-amber-700' :
                                                                                                                        'bg-emerald-50 text-emerald-700'
                                                                                                                    }`}>
                                                                                                                    {qty}
                                                                                                                </span>
                                                                                                                <button
                                                                                                                    onClick={(e) => { e.stopPropagation(); handleStockEdit(v.id, branch.id, qty); }}
                                                                                                                    className="p-0.5 rounded text-slate-300 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover/stock:opacity-100"
                                                                                                                    title="Edit stock"
                                                                                                                >
                                                                                                                    <span className="material-symbols-outlined text-[14px]">edit</span>
                                                                                                                </button>
                                                                                                            </>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white">
                        <p className="text-sm text-slate-500">
                            Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of <span className="font-semibold text-slate-900">{totalProducts}</span> products
                        </p>
                    </div>
                </div>
            </div>

            {/* Add/Edit Product Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {editingProduct ? 'Update product details.' : 'Fill in details to add a new item to your catalog.'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-500 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto p-6 flex-1">
                            {formError && (
                                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">{formError}</div>
                            )}
                            <form onSubmit={handleSubmit} id="product-form" className="space-y-5">
                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Product Image</label>
                                    <div className="flex items-start gap-4">
                                        <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0">
                                            {imagePreview ? (
                                                <>
                                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                        className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5 text-slate-500 hover:text-red-500 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="material-symbols-outlined text-3xl text-slate-400">add_photo_alternate</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium cursor-pointer hover:bg-primary/20 transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">upload</span>
                                                {imagePreview ? 'Change Image' : 'Upload Image'}
                                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                            </label>
                                            <p className="text-xs text-slate-400 mt-2">JPEG, PNG, WebP. Max 5MB.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Product Name</label>
                                        <input
                                            className="block w-full rounded-xl border-slate-200 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:ring-primary shadow-sm"
                                            placeholder="e.g. Vintage Denim Jacket"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                                        <select
                                            className="block w-full rounded-xl border-slate-200 py-2.5 text-sm focus:border-primary focus:ring-primary shadow-sm"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="Men">Men</option>
                                            <option value="Women">Women</option>
                                            <option value="Kids">Kids</option>
                                            <option value="Accessories">Accessories</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Brand</label>
                                        <input
                                            className="block w-full rounded-xl border-slate-200 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:ring-primary shadow-sm"
                                            placeholder="e.g. Levi's"
                                            value={formData.brand}
                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                                        <textarea
                                            className="block w-full rounded-xl border-slate-200 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:ring-primary shadow-sm"
                                            placeholder="Product description (optional)"
                                            rows="2"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Variants — only show for new products */}
                                {!editingProduct && (
                                    <div className="pt-4 border-t border-slate-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">style</span>
                                                Variants
                                            </h4>
                                            <button type="button" onClick={handleAddVariantRow} className="text-sm text-primary hover:text-blue-600 font-medium flex items-center gap-1">
                                                <span className="material-symbols-outlined text-lg">add_circle</span>
                                                Add variant
                                            </button>
                                        </div>
                                        {formData.variants.map((v, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-xl p-4 mb-3 border border-slate-100">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xs font-semibold text-slate-500">Variant {idx + 1}</span>
                                                    {formData.variants.length > 1 && (
                                                        <button type="button" onClick={() => handleRemoveVariantRow(idx)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-500 mb-1">Size</label>
                                                        <select className="block w-full rounded-lg border-slate-200 text-sm py-2" value={v.size} onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}>
                                                            <option value="XS">XS</option>
                                                            <option value="S">S</option>
                                                            <option value="M">M</option>
                                                            <option value="L">L</option>
                                                            <option value="XL">XL</option>
                                                            <option value="XXL">XXL</option>
                                                            <option value="Free">Free Size</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-500 mb-1">Color</label>
                                                        <input className="block w-full rounded-lg border-slate-200 text-sm py-2" placeholder="e.g. Navy" value={v.color} onChange={(e) => handleVariantChange(idx, 'color', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-500 mb-1">SKU</label>
                                                        <input className="block w-full rounded-lg border-slate-200 text-sm py-2" placeholder="e.g. WT-001" value={v.sku} onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-500 mb-1">Cost Price ($)</label>
                                                        <input className="block w-full rounded-lg border-slate-200 text-sm py-2" type="number" step="0.01" placeholder="0.00" value={v.cost_price} onChange={(e) => handleVariantChange(idx, 'cost_price', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-500 mb-1">Selling Price ($)</label>
                                                        <input className="block w-full rounded-lg border-slate-200 text-sm py-2" type="number" step="0.01" placeholder="0.00" value={v.selling_price} onChange={(e) => handleVariantChange(idx, 'selling_price', e.target.value)} required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-500 mb-1">Stock Qty</label>
                                                        <input className="block w-full rounded-lg border-slate-200 text-sm py-2" type="number" placeholder="0" value={v.stock_quantity} onChange={(e) => handleVariantChange(idx, 'stock_quantity', e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
                                Cancel
                            </button>
                            <button type="submit" form="product-form" disabled={formLoading} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 hover:shadow-lg transition-all disabled:opacity-70">
                                {formLoading ? 'Saving...' : editingProduct ? 'Update Product' : 'Save Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Products;
