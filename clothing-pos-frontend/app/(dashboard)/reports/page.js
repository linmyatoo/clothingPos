'use client';

import React, { useState, useEffect } from 'react';
import { getDailyReport, getMonthlyReport, getYearlyReport, getBranches, getSale, updateSale, deleteSale, getProducts } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

function Reports() {
    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const [tab, setTab] = useState('daily');
    const [dailyDate, setDailyDate] = useState(localDateStr);
    const [monthYear, setMonthYear] = useState(now.getFullYear());
    const [monthMonth, setMonthMonth] = useState(now.getMonth() + 1);
    const [yearYear, setYearYear] = useState(now.getFullYear());
    const [user, setUser] = useState(null);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [expandedSaleId, setExpandedSaleId] = useState(null);
    const [saleItems, setSaleItems] = useState([]);
    const [loadingSaleItems, setLoadingSaleItems] = useState(false);
    const [editSale, setEditSale] = useState(null);
    const { t } = useLanguage();

    useEffect(() => {
        try { setUser(JSON.parse(localStorage.getItem('user') || '{}')); } catch { }
        fetchBranches();
    }, []);

    useEffect(() => { fetchReport(); }, [tab, dailyDate, monthYear, monthMonth, yearYear, selectedBranch]);

    const fetchBranches = async () => {
        try {
            const res = await getBranches();
            setBranches(res.data);
        } catch (err) {
            console.error('Failed to fetch branches:', err);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            let res;
            const branchId = selectedBranch || null;
            if (tab === 'daily') res = await getDailyReport(dailyDate, branchId);
            else if (tab === 'monthly') res = await getMonthlyReport(monthYear, monthMonth, branchId);
            else res = await getYearlyReport(yearYear, branchId);
            setData(res.data);
        } catch (err) {
            setError('Failed to load report');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleTransactionClick = async (saleId) => {
        if (expandedSaleId === saleId) {
            setExpandedSaleId(null);
            setSaleItems([]);
            return;
        }
        setExpandedSaleId(saleId);
        setLoadingSaleItems(true);
        try {
            const res = await getSale(saleId);
            setSaleItems(res.data.items || []);
        } catch (err) {
            console.error('Failed to fetch sale items:', err);
            setSaleItems([]);
        } finally {
            setLoadingSaleItems(false);
        }
    };

    const handleDeleteSale = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this sale? This will permanently restore stock for all items.')) return;
        try {
            await deleteSale(id);
            fetchReport();
            if (expandedSaleId === id) setExpandedSaleId(null);
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to delete sale');
        }
    };

    const handleEditSale = (e, sale) => {
        e.stopPropagation();
        setEditSale(sale);
    };

    const totalTransactions = parseInt(data?.summary?.total_transactions || 0);
    const totalRevenue = parseFloat(data?.summary?.total_revenue || 0);
    const totalCost = parseFloat(data?.summary?.total_cost || 0);
    const totalProfit = totalRevenue - totalCost;
    const avgTransaction = totalTransactions > 0 ? (totalRevenue / totalTransactions) : 0;

    // Get the period label
    const getPeriodLabel = () => {
        if (tab === 'daily') return new Date(dailyDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (tab === 'monthly') return `${MONTH_NAMES[monthMonth - 1]} ${monthYear}`;
        return `Year ${yearYear}`;
    };

    // Get table data depending on tab
    const getTableRows = () => {
        if (tab === 'daily') return data?.sales || [];
        if (tab === 'monthly') return data?.daily || [];
        return data?.monthly || [];
    };

    // Revenue bar chart (simple CSS bars)
    const getChartData = () => {
        if (tab === 'daily') {
            // Group by hour
            const sales = data?.sales || [];
            if (sales.length === 0) return [];
            const hourly = {};
            sales.forEach(s => {
                const h = new Date(s.created_at).getHours();
                hourly[h] = (hourly[h] || 0) + parseFloat(s.total_amount);
            });
            return Object.entries(hourly).map(([h, v]) => ({
                label: `${h}:00`,
                value: v,
            })).sort((a, b) => parseInt(a.label) - parseInt(b.label));
        }
        if (tab === 'monthly') {
            return (data?.daily || []).map(d => ({
                label: new Date(d.date).getDate().toString(),
                value: parseFloat(d.revenue),
            }));
        }
        return (data?.monthly || []).map(m => ({
            label: MONTH_NAMES[m.month - 1]?.substring(0, 3),
            value: parseFloat(m.revenue),
        }));
    };

    const chartData = getChartData();
    const maxChartValue = Math.max(...chartData.map(d => d.value), 1);

    const tabs = [
        { key: 'daily', label: 'Daily', icon: 'today' },
        { key: 'monthly', label: 'Monthly', icon: 'calendar_month' },
        { key: 'yearly', label: 'Yearly', icon: 'date_range' },
    ];

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-5 backdrop-blur-xl">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-slate-900">{t('sale_reports')}</h2>
                    <p className="text-sm text-slate-500">Track sales performance and analyze trends.</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
                    {/* Controls Row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 inline-flex">
                            {tabs.map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setTab(t.key)}
                                    className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${tab === t.key
                                        ? 'bg-primary text-white shadow-md shadow-blue-500/20'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500 font-medium mr-1">Period:</span>
                            {tab === 'daily' && (
                                <input
                                    type="date"
                                    value={dailyDate}
                                    onChange={(e) => setDailyDate(e.target.value)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-primary focus:border-primary shadow-sm"
                                />
                            )}
                            {tab === 'monthly' && (
                                <>
                                    <select value={monthMonth} onChange={(e) => setMonthMonth(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-primary focus:border-primary shadow-sm">
                                        {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                    </select>
                                    <select value={monthYear} onChange={(e) => setMonthYear(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-primary focus:border-primary shadow-sm">
                                        {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
                                    </select>
                                </>
                            )}
                            {tab === 'yearly' && (
                                <select value={yearYear} onChange={(e) => setYearYear(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-primary focus:border-primary shadow-sm">
                                    {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
                                </select>
                            )}
                            <button onClick={fetchReport} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-primary transition-all shadow-sm" title="Refresh">
                                <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                            </button>
                            {user?.role === 'admin' && branches.length > 0 && (
                                <select
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-primary focus:border-primary shadow-sm"
                                >
                                    <option value="">All Branches</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Period Label */}
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-1 bg-primary rounded-full"></div>
                        <div>
                            <p className="text-lg font-bold text-slate-900">{getPeriodLabel()}</p>
                            <p className="text-xs text-slate-500">{tab === 'daily' ? 'Showing individual transactions' : tab === 'monthly' ? 'Showing daily breakdown' : 'Showing monthly breakdown'}</p>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-200 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            {error}
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <span className="material-symbols-outlined">sell</span>
                                </div>
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{tab}</span>
                            </div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Total Transactions</p>
                            <h3 className="text-slate-900 text-3xl font-bold tracking-tight">
                                {loading ? '—' : totalTransactions.toLocaleString()}
                            </h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <span className="material-symbols-outlined">payments</span>
                                </div>
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{tab}</span>
                            </div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Total Revenue</p>
                            <h3 className="text-slate-900 text-3xl font-bold tracking-tight">
                                {loading ? '—' : `${totalRevenue.toFixed(2)} MMK`}
                            </h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                                    <span className="material-symbols-outlined">receipt_long</span>
                                </div>
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">avg</span>
                            </div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Avg. Transaction</p>
                            <h3 className="text-slate-900 text-3xl font-bold tracking-tight">
                                {loading ? '—' : `${avgTransaction.toFixed(2)} MMK`}
                            </h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                                    <span className="material-symbols-outlined">monitoring</span>
                                </div>
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{tab}</span>
                            </div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Total Profit</p>
                            <h3 className="text-slate-900 text-3xl font-bold tracking-tight">
                                {loading ? '—' : `${totalProfit.toFixed(2)} MMK`}
                            </h3>
                        </div>
                    </div>

                    {/* Revenue Chart + Table */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Revenue Chart */}
                        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Revenue Overview</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">{tab === 'daily' ? 'Hourly breakdown' : tab === 'monthly' ? 'Daily breakdown' : 'Monthly breakdown'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    <span className="text-xs text-slate-500 font-medium">Revenue</span>
                                </div>
                            </div>
                            {loading ? (
                                <div className="h-64 flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
                                    Loading...
                                </div>
                            ) : chartData.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined text-3xl mb-2 opacity-50">bar_chart</span>
                                    <p className="text-sm">No revenue data for this period</p>
                                </div>
                            ) : (
                                <div className="h-64 mt-4 -ml-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value} MMK`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                                formatter={(value) => [`${value.toFixed(2)} MMK`, 'Revenue']}
                                                labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                                            />
                                            <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Summary Panel */}
                        <div className="w-full lg:w-80 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Quick Summary</h3>
                            <p className="text-sm text-slate-500 mb-6">{getPeriodLabel()}</p>
                            <div className="flex flex-col gap-4 flex-1">
                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                            <span className="material-symbols-outlined text-[20px]">trending_up</span>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">Revenue</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">{totalRevenue.toFixed(2)} MMK</span>
                                </div>
                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                            <span className="material-symbols-outlined text-[20px]">receipt</span>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">Orders</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">{totalTransactions}</span>
                                </div>
                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                                            <span className="material-symbols-outlined text-[20px]">avg_pace</span>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">Avg. Order</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">{avgTransaction.toFixed(2)} MMK</span>
                                </div>
                                {tab === 'daily' && data?.sales && (
                                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                                <span className="material-symbols-outlined text-[20px]">schedule</span>
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">Last Sale</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">
                                            {data.sales.length > 0
                                                ? new Date(data.sales[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : 'None'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {tab !== 'daily' && (
                                <div className="mt-6 pt-4 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 mb-2">Best Period</p>
                                    {(() => {
                                        const rows = tab === 'monthly' ? (data?.daily || []) : (data?.monthly || []);
                                        if (rows.length === 0) return <p className="text-sm text-slate-400 italic">No data</p>;
                                        const best = rows.reduce((a, b) => parseFloat(b.revenue) > parseFloat(a.revenue) ? b : a, rows[0]);
                                        const label = tab === 'monthly'
                                            ? new Date(best.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                            : MONTH_NAMES[best.month - 1];
                                        return (
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                                    <span className="material-symbols-outlined text-[20px]">stars</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                                                    <p className="text-xs text-emerald-600">{parseFloat(best.revenue).toFixed(2)} MMK · {best.transactions} orders</p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                {tab === 'daily' ? 'Transactions' : tab === 'monthly' ? 'Daily Breakdown' : 'Monthly Breakdown'}
                            </h3>
                            <p className="text-sm text-slate-500 mt-0.5">
                                {tab === 'daily' ? 'All individual sales for this date' : tab === 'monthly' ? 'Revenue by day of the month' : 'Revenue by month'}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="py-3.5 px-6 font-semibold text-xs uppercase tracking-wider text-slate-500">
                                            {tab === 'daily' ? 'Invoice' : tab === 'monthly' ? 'Date' : 'Month'}
                                        </th>
                                        {tab === 'daily' && <th className="py-3.5 px-6 font-semibold text-xs uppercase tracking-wider text-slate-500">Time</th>}
                                        {tab === 'daily' && <th className="py-3.5 px-6 font-semibold text-xs uppercase tracking-wider text-slate-500">Cashier</th>}
                                        <th className="py-3.5 px-6 font-semibold text-xs uppercase tracking-wider text-slate-500 text-right">
                                            {tab === 'daily' ? 'Payment' : 'Transactions'}
                                        </th>
                                        <th className="py-3.5 px-6 font-semibold text-xs uppercase tracking-wider text-slate-500 text-right">Amount</th>
                                        {tab === 'daily' && <th className="py-3.5 px-6 font-semibold text-xs uppercase tracking-wider text-slate-500 text-right">Status</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                                <span className="material-symbols-outlined text-2xl animate-spin mr-2">refresh</span>
                                                Loading report data...
                                            </td>
                                        </tr>
                                    ) : getTableRows().length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50 block">receipt_long</span>
                                                No transactions found for this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {tab === 'daily' && data?.sales?.map((s) => (
                                                <React.Fragment key={s.id}>
                                                <tr className={`group hover:bg-slate-50/50 transition-colors cursor-pointer ${expandedSaleId === s.id ? 'bg-slate-50/50' : ''}`} onClick={() => handleTransactionClick(s.id)}>
                                                    <td className="py-4 px-6 relative">
                                                        <span className="font-semibold text-slate-900">#{s.invoice_number}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-500">
                                                        {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                                {(s.cashier_name || 'U').charAt(0)}
                                                            </div>
                                                            <span className="text-slate-700">{s.cashier_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${s.payment_method === 'cash'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : s.payment_method === 'card'
                                                                ? 'bg-blue-50 text-blue-700'
                                                                : 'bg-violet-50 text-violet-700'
                                                            }`}>
                                                            {(s.payment_method || 'cash').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-semibold text-slate-900">{parseFloat(s.total_amount).toFixed(2)} MMK</td>
                                                    <td className="py-4 px-6 text-right flex items-center justify-end gap-3">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            Paid
                                                        </span>
                                                        {user?.role === 'admin' && (
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={(e) => handleEditSale(e, s)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit Sale">
                                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                                </button>
                                                                <button onClick={(e) => handleDeleteSale(e, s.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded" title="Delete Sale">
                                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                                {expandedSaleId === s.id && (
                                                    <tr>
                                                        <td colSpan="6" className="p-0 border-b border-slate-100">
                                                            <div className="bg-slate-50 p-6 shadow-inner border-y border-slate-200/60">
                                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Items Sold</h4>
                                                                {loadingSaleItems ? (
                                                                    <div className="flex items-center text-sm text-slate-400"><span className="material-symbols-outlined text-lg animate-spin mr-2">refresh</span>Loading items...</div>
                                                                ) : saleItems.length === 0 ? (
                                                                    <p className="text-sm text-slate-500 italic">No items found for this transaction.</p>
                                                                ) : (
                                                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                                                        <table className="w-full text-left text-sm">
                                                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                                                <tr>
                                                                                    <th className="py-2.5 px-4 font-medium text-slate-500">Product</th>
                                                                                    <th className="py-2.5 px-4 font-medium text-slate-500">Variant</th>
                                                                                    <th className="py-2.5 px-4 font-medium text-slate-500 text-right">Qty</th>
                                                                                    <th className="py-2.5 px-4 font-medium text-slate-500 text-right">Price</th>
                                                                                    <th className="py-2.5 px-4 font-medium text-slate-500 text-right">Subtotal</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-slate-100">
                                                                                {saleItems.map((item, idx) => (
                                                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                                                        <td className="py-3 px-4 font-medium text-slate-900">{item.product_name}</td>
                                                                                        <td className="py-3 px-4 text-slate-600">
                                                                                            {item.size || 'N/A'}{item.color ? ` • ${item.color}` : ''}
                                                                                        </td>
                                                                                        <td className="py-3 px-4 text-right font-medium text-slate-700">{item.quantity}</td>
                                                                                        <td className="py-3 px-4 text-right text-slate-600">{parseFloat(item.price).toFixed(2)} MMK</td>
                                                                                        <td className="py-3 px-4 text-right font-semibold text-slate-900">{(item.quantity * item.price).toFixed(2)} MMK</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                </React.Fragment>
                                            ))}
                                            {tab === 'monthly' && data?.daily?.map((d) => (
                                                <tr key={d.date} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <span className="font-semibold text-slate-900">
                                                            {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right text-slate-700">{d.transactions}</td>
                                                    <td className="py-4 px-6 text-right font-semibold text-slate-900">{parseFloat(d.revenue).toFixed(2)} MMK</td>
                                                </tr>
                                            ))}
                                            {tab === 'yearly' && data?.monthly?.map((m) => (
                                                <tr key={m.month} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <span className="font-semibold text-slate-900">{MONTH_NAMES[m.month - 1]}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right text-slate-700">{m.transactions}</td>
                                                    <td className="py-4 px-6 text-right font-semibold text-slate-900">{parseFloat(m.revenue).toFixed(2)} MMK</td>
                                                </tr>
                                            ))}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
                            <p className="text-sm text-slate-500">
                                <span className="font-semibold text-slate-900">{getTableRows().length}</span> {tab === 'daily' ? 'transactions' : 'periods'}
                            </p>
                            <p className="text-sm text-slate-500">
                                Total: <span className="font-bold text-slate-900">{totalRevenue.toFixed(2)} MMK</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {editSale && (
                <EditTransactionModal 
                    sale={editSale} 
                    onClose={() => setEditSale(null)} 
                    onSave={() => { setEditSale(null); fetchReport(); }} 
                />
            )}
        </>
    );
}

function EditTransactionModal({ sale, onClose, onSave }) {
    const [items, setItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState(sale.payment_method);

    useEffect(() => {
        const init = async () => {
            try {
                const [saleRes, productsRes] = await Promise.all([
                    getSale(sale.id),
                    getProducts(sale.branch_id)
                ]);
                setItems(saleRes.data.items.map(item => ({
                    variant_id: item.variant_id,
                    product_name: item.product_name,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    price: parseFloat(item.price)
                })));
                setProducts(productsRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [sale]);

    const handleQuantityChange = (index, delta) => {
        const newItems = [...items];
        const newItem = { ...newItems[index] };
        newItem.quantity += delta;
        if (newItem.quantity < 1) newItem.quantity = 1;
        newItems[index] = newItem;
        setItems(newItems);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleAddProduct = (e) => {
        const variantId = parseInt(e.target.value);
        if (!variantId) return;
        
        let selectedVariant = null;
        let selectedProduct = null;
        for (const p of products) {
            const variantsList = p.Variants || p.variants || [];
            for (const v of variantsList) {
                if (Number(v.id) === variantId) {
                    selectedVariant = v;
                    selectedProduct = p;
                }
            }
        }
        
        if (selectedVariant) {
            const existing = items.findIndex(i => i.variant_id === variantId);
            if (existing >= 0) {
                handleQuantityChange(existing, 1);
            } else {
                setItems([...items, {
                    variant_id: variantId,
                    product_name: selectedProduct.name,
                    size: selectedVariant.size,
                    color: selectedVariant.color,
                    quantity: 1,
                    price: parseFloat(selectedVariant.selling_price)
                }]);
            }
        }
        e.target.value = '';
    };

    const handleSubmit = async () => {
        if (items.length === 0) return alert('Cannot save an empty invoice.');
        try {
            await updateSale(sale.id, { items, payment_method: paymentMethod });
            onSave();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update sale');
        }
    };

    if (loading) return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"><div className="bg-white p-6 rounded-2xl shadow-xl font-medium text-slate-600 flex items-center gap-3"><span className="material-symbols-outlined animate-spin">refresh</span>Loading invoice...</div></div>;

    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-900/5">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-md">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Edit Invoice</h3>
                        <p className="text-sm font-medium text-primary mt-0.5">#{sale.invoice_number}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex flex-col items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"><span className="material-symbols-outlined text-[20px]">close</span></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-6 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                        <label className="block text-sm font-bold text-slate-800 mb-2">Add Items</label>
                        <select onChange={handleAddProduct} className="w-full px-4 py-3 border border-blue-200 rounded-xl bg-white shadow-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                            <option value="">+ Find and select a product to add...</option>
                            {products.map(p => {
                                const variantsList = p.Variants || p.variants || [];
                                return variantsList.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {p.name} - {v.size} {v.color ? `(${v.color})` : ''} - {parseFloat(v.selling_price).toFixed(2)} MMK (Available: {v.stock_quantity})
                                    </option>
                                ));
                            })}
                        </select>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500 text-[18px]">shopping_cart</span>
                        Current Items
                    </h4>
                    
                    <div className="border border-slate-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-5 font-semibold text-slate-500 uppercase tracking-wider text-xs">Product Details</th>
                                    <th className="py-3 px-5 font-semibold text-slate-500 uppercase tracking-wider text-xs text-center">Qty</th>
                                    <th className="py-3 px-5 font-semibold text-slate-500 uppercase tracking-wider text-xs text-right">Unit Price</th>
                                    <th className="py-3 px-5 font-semibold text-slate-500 uppercase tracking-wider text-xs text-right">Line Total</th>
                                    <th className="py-3 px-5 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-400 italic">No items remaining. Invoice will be invalid.</td>
                                    </tr>
                                ) : items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/30">
                                        <td className="py-4 px-5">
                                            <p className="font-bold text-slate-800">{item.product_name}</p>
                                            <p className="text-xs font-medium text-slate-500 mt-0.5">{item.size} • {item.color}</p>
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="flex items-center justify-center">
                                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                                                    <button type="button" onClick={() => handleQuantityChange(idx, -1)} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"><span className="material-symbols-outlined text-[16px]">remove</span></button>
                                                    <span className="w-10 text-center font-bold text-sm text-slate-900">{item.quantity}</span>
                                                    <button type="button" onClick={() => handleQuantityChange(idx, 1)} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"><span className="material-symbols-outlined text-[16px]">add</span></button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 text-right font-medium text-slate-600">{item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} MMK</td>
                                        <td className="py-4 px-5 text-right font-bold text-slate-900">{(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })} MMK</td>
                                        <td className="py-4 px-5 text-center">
                                            <button onClick={() => handleRemoveItem(idx)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 w-8 h-8 flex items-center justify-center rounded-lg transition-all" title="Remove Item">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <div className="w-full sm:w-64">
                            <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400 text-[18px]">payments</span>
                                Payment Method
                            </label>
                            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm bg-white">
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="transfer">Bank Transfer</option>
                            </select>
                        </div>
                        <div className="text-right flex-1 pt-4 sm:pt-0 border-t border-slate-200 sm:border-0 mt-2 sm:mt-0">
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">New Invoice Total</p>
                            <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">{total.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg text-emerald-600/70 ml-1">MMK</span></p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-5 bg-white border-t border-slate-100 flex justify-end gap-3 rounded-b-3xl">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Reports;
