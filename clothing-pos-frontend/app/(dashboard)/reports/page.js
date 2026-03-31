'use client';

import { useState, useEffect } from 'react';
import { getDailyReport, getMonthlyReport, getYearlyReport, getBranches } from '../../../services/api';
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
                                                <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6">
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
                                                    <td className="py-4 px-6 text-right">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            Paid
                                                        </span>
                                                    </td>
                                                </tr>
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
        </>
    );
}

export default Reports;
