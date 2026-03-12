'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';

function Branches() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [formData, setFormData] = useState({ name: '', address: '', phone: '', is_active: true });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const { t } = useLanguage();

    useEffect(() => { fetchBranches(); }, []);
    useEffect(() => { if (successMsg) { const timer = setTimeout(() => setSuccessMsg(''), 3000); return () => clearTimeout(timer); } }, [successMsg]);

    const fetchBranches = async () => {
        try {
            const res = await getBranches();
            setBranches(res.data);
        } catch (err) {
            console.error('Failed to fetch branches:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingBranch(null);
        setFormData({ name: '', address: '', phone: '', is_active: true });
        setFormError('');
        setShowModal(true);
    };

    const handleOpenEdit = (branch) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name,
            address: branch.address || '',
            phone: branch.phone || '',
            is_active: branch.is_active === 1 || branch.is_active === true,
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        try {
            if (editingBranch) {
                await updateBranch(editingBranch.id, formData);
                setSuccessMsg('Branch updated successfully!');
            } else {
                if (!formData.name.trim()) {
                    setFormError('Branch name is required.');
                    setFormLoading(false);
                    return;
                }
                await createBranch(formData);
                setSuccessMsg('Branch created successfully!');
            }
            setShowModal(false);
            fetchBranches();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Operation failed.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Are you sure you want to delete branch "${name}"? This cannot be undone.`)) return;
        try {
            await deleteBranch(id);
            setSuccessMsg('Branch deleted.');
            fetchBranches();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete branch.');
        }
    };

    const activeCount = branches.filter(b => b.is_active === 1 || b.is_active === true).length;
    const inactiveCount = branches.length - activeCount;

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-5 backdrop-blur-xl">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-slate-900">{t('branch_management')}</h2>
                    <p className="text-sm text-slate-500">Manage your shop branches and locations.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Add Branch</span>
                </button>
            </header>

            {/* Success Message */}
            {successMsg && (
                <div className="mx-8 mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200 flex items-center gap-2 animate-fade-in">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    {successMsg}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
                <div className="flex flex-col gap-1 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 text-blue-600">
                            <span className="material-symbols-outlined">store</span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Total Branches</p>
                    <p className="text-3xl font-bold text-slate-900">{branches.length}</p>
                </div>
                <div className="flex flex-col gap-1 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-50 text-emerald-600">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Active</p>
                    <p className="text-3xl font-bold text-slate-900">{activeCount}</p>
                </div>
                <div className="flex flex-col gap-1 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-rose-50 text-rose-600">
                            <span className="material-symbols-outlined">cancel</span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Inactive</p>
                    <p className="text-3xl font-bold text-slate-900">{inactiveCount}</p>
                </div>
            </div>

            {/* Branch Cards */}
            <div className="flex-1 px-8 pb-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                        <span className="material-symbols-outlined text-3xl animate-spin mr-3">refresh</span>
                        <span>Loading branches...</span>
                    </div>
                ) : branches.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <span className="material-symbols-outlined text-5xl mb-3 opacity-50 block">store</span>
                        <p className="text-lg">No branches yet</p>
                        <p className="text-sm mt-1">Click &quot;Add Branch&quot; to create your first branch.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {branches.map((branch) => (
                            <div key={branch.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-blue-100 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-[28px]">store</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{branch.name}</h3>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${(branch.is_active === 1 || branch.is_active === true) ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${(branch.is_active === 1 || branch.is_active === true) ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                    {(branch.is_active === 1 || branch.is_active === true) ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        {branch.address && (
                                            <div className="flex items-start gap-2 text-sm text-slate-600">
                                                <span className="material-symbols-outlined text-[18px] text-slate-400 mt-0.5">location_on</span>
                                                <span>{branch.address}</span>
                                            </div>
                                        )}
                                        {branch.phone && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <span className="material-symbols-outlined text-[18px] text-slate-400">phone</span>
                                                <span>{branch.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span className="material-symbols-outlined text-[18px] text-slate-400">calendar_today</span>
                                            <span>Created {new Date(branch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                    <Link
                                        href={`/branches/stock?branch=${branch.id}`}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                                        Manage Stock
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenEdit(branch)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-primary hover:bg-white transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(branch.id, branch.name)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Branch Modal */}
            {showModal && (
                <div aria-labelledby="modal-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog">
                    <div aria-hidden="true" className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-8 shadow-2xl transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900" id="modal-title">
                                    {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {editingBranch ? 'Update branch information.' : 'Create a new shop branch location.'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-500 transition-colors" type="button">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {formError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="branch-name">Branch Name</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="material-symbols-outlined text-[20px] text-slate-400">store</span>
                                    </div>
                                    <input
                                        className="block w-full rounded-xl border-slate-200 py-2.5 pl-10 text-sm placeholder:text-slate-400 focus:border-primary focus:ring-primary shadow-sm"
                                        id="branch-name"
                                        placeholder="e.g. Downtown Branch"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="branch-address">Address</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="material-symbols-outlined text-[20px] text-slate-400">location_on</span>
                                    </div>
                                    <input
                                        className="block w-full rounded-xl border-slate-200 py-2.5 pl-10 text-sm placeholder:text-slate-400 focus:border-primary focus:ring-primary shadow-sm"
                                        id="branch-address"
                                        placeholder="e.g. 123 Main St, City"
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="branch-phone">Phone</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="material-symbols-outlined text-[20px] text-slate-400">phone</span>
                                    </div>
                                    <input
                                        className="block w-full rounded-xl border-slate-200 py-2.5 pl-10 text-sm placeholder:text-slate-400 focus:border-primary focus:ring-primary shadow-sm"
                                        id="branch-phone"
                                        placeholder="e.g. 09-123-456-789"
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            {editingBranch && (
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="branch-active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="branch-active" className="text-sm font-medium text-slate-700">Active branch</label>
                                </div>
                            )}
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-70"
                                    type="submit"
                                    disabled={formLoading}
                                >
                                    {formLoading ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Branches;
