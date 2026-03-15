'use client';

import { useState, useEffect } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getBranches } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';

function Employees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee', branch_id: '' });
    const [branches, setBranches] = useState([]);
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const { t } = useLanguage();

    useEffect(() => {
        fetchEmployees();
        fetchBranches();
    }, []);

    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    const fetchEmployees = async () => {
        try {
            const res = await getEmployees();
            setEmployees(res.data);
        } catch (err) {
            console.error('Failed to fetch employees:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await getBranches();
            setBranches(res.data);
        } catch (err) {
            console.error('Failed to fetch branches:', err);
        }
    };

    const handleOpenAdd = () => {
        setEditingEmployee(null);
        setFormData({ name: '', email: '', password: '', role: 'employee', branch_id: '' });
        setFormError('');
        setShowModal(true);
    };

    const handleOpenEdit = (emp) => {
        setEditingEmployee(emp);
        setFormData({ name: emp.name, email: emp.email, password: '', role: emp.role, branch_id: emp.branch_id || '' });
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        try {
            if (editingEmployee) {
                await updateEmployee(editingEmployee.id, {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    branch_id: formData.branch_id || null,
                });
                setSuccessMsg('Employee updated successfully!');
            } else {
                if (!formData.password || formData.password.length < 6) {
                    setFormError('Password must be at least 6 characters.');
                    setFormLoading(false);
                    return;
                }
                await createEmployee(formData);
                setSuccessMsg('Employee added successfully!');
            }
            setShowModal(false);
            fetchEmployees();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Operation failed.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        try {
            await deleteEmployee(id);
            setSuccessMsg('Employee deleted.');
            fetchEmployees();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete employee.');
        }
    };

    const filtered = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const adminCount = employees.filter(e => e.role === 'admin').length;
    const employeeCount = employees.filter(e => e.role === 'employee').length;

    const getRoleBadge = (role) => {
        if (role === 'admin') {
            return <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">Admin</span>;
        }
        return <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/10">Employee</span>;
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getAvatarColor = (name) => {
        const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500'];
        const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
        return colors[idx];
    };

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-5 backdrop-blur-xl">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-slate-900">Employee Directory</h2>
                    <p className="text-sm text-slate-500">Manage your team members and their access levels.</p>
                </div>
                <div className="flex gap-3">

                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>Add Employee</span>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
                <div className="flex flex-col gap-1 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 text-blue-600">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Total Employees</p>
                    <p className="text-3xl font-bold text-slate-900">{employees.length}</p>
                </div>
                <div className="flex flex-col gap-1 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-50 text-indigo-600">
                            <span className="material-symbols-outlined">admin_panel_settings</span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Admins</p>
                    <p className="text-3xl font-bold text-slate-900">{adminCount}</p>
                </div>
                <div className="flex flex-col gap-1 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-50 text-emerald-600">
                            <span className="material-symbols-outlined">badge</span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Staff</p>
                    <p className="text-3xl font-bold text-slate-900">{employeeCount}</p>
                </div>
            </div>

            {/* Employee Table */}
            <div className="flex-1 px-4 md:px-8 pb-8">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 w-[25%]">Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 w-[20%]">Email</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 w-[10%]">Role</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 w-[15%]">Branch</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 w-[15%]">Joined</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right w-[15%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                            <span className="material-symbols-outlined text-3xl animate-spin mr-2">refresh</span>
                                            Loading employees...
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50 block">person_off</span>
                                            {searchTerm ? 'No employees found matching your search.' : 'No employees yet. Click "Add Employee" to get started.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((emp) => (
                                        <tr key={emp.id} className="group hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${getAvatarColor(emp.name)}`}>
                                                        {getInitials(emp.name)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">{emp.name}</p>
                                                        <p className="text-xs text-slate-500">ID: #{emp.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600">{emp.email}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getRoleBadge(emp.role)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {emp.branch_name ? (
                                                    <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                                                        <span className="material-symbols-outlined text-[14px] text-slate-400">store</span>
                                                        {emp.branch_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-500">
                                                    {new Date(emp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenEdit(emp)}
                                                        className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-all"
                                                        title="Edit"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(emp.id, emp.name)}
                                                        className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                        title="Delete"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
                        <div className="text-sm text-slate-500">
                            Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of <span className="font-semibold text-slate-900">{employees.length}</span> employees
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Employee Modal */}
            {showModal && (
                <div aria-labelledby="modal-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog">
                    <div aria-hidden="true" className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-8 shadow-2xl transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900" id="modal-title">
                                    {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {editingEmployee ? 'Update employee information.' : 'Create a new account for a staff member.'}
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
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="full-name">Full Name</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="material-symbols-outlined text-[20px] text-slate-400">person</span>
                                    </div>
                                    <input
                                        className="block w-full rounded-xl border-slate-200 py-2.5 pl-10 text-sm placeholder:text-slate-400 focus:border-primary focus:ring-primary shadow-sm"
                                        id="full-name"
                                        placeholder="e.g. Sarah Connor"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="email">Email Address</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="material-symbols-outlined text-[20px] text-slate-400">mail</span>
                                    </div>
                                    <input
                                        className="block w-full rounded-xl border-slate-200 py-2.5 pl-10 text-sm placeholder:text-slate-400 focus:border-primary focus:ring-primary shadow-sm"
                                        id="email"
                                        placeholder="name@store.com"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="role">Role</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="material-symbols-outlined text-[20px] text-slate-400">badge</span>
                                    </div>
                                    <select
                                        className="block w-full rounded-xl border-slate-200 py-2.5 pl-10 pr-10 text-sm text-slate-900 focus:border-primary focus:ring-primary shadow-sm appearance-none bg-none"
                                        id="role"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <span className="material-symbols-outlined text-[20px] text-slate-400">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="branch">Branch</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="material-symbols-outlined text-[20px] text-slate-400">store</span>
                                    </div>
                                    <select
                                        className="block w-full rounded-xl border-slate-200 py-2.5 pl-10 pr-10 text-sm text-slate-900 focus:border-primary focus:ring-primary shadow-sm appearance-none bg-none"
                                        id="branch"
                                        value={formData.branch_id}
                                        onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                    >
                                        <option value="">No Branch</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <span className="material-symbols-outlined text-[20px] text-slate-400">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            {!editingEmployee && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="password">Password</label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <span className="material-symbols-outlined text-[20px] text-slate-400">lock</span>
                                        </div>
                                        <input
                                            className="block w-full rounded-xl border-slate-200 py-2.5 pl-10 pr-10 text-sm placeholder:text-slate-400 focus:border-primary focus:ring-primary shadow-sm"
                                            id="password"
                                            placeholder="••••••••"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required={!editingEmployee}
                                            minLength={6}
                                        />
                                    </div>
                                    <p className="mt-1.5 text-xs text-slate-500">Must be at least 6 characters long.</p>
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
                                    {formLoading ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Add Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Employees;
