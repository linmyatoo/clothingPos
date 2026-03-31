'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats, getLowStock, getBranches, getPerformance } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [performance, setPerformance] = useState({ bestSelling: [], normal: [], lessSelling: [] });
    const { t } = useLanguage();

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userData = JSON.parse(userStr);
                setUser(userData);
                let branchParam = null;
                if (userData.role === 'admin' && selectedBranch) {
                    branchParam = selectedBranch;
                } else if (userData.role !== 'admin') {
                    branchParam = userData.branch_id;
                }

                if (userData.role === 'admin') {
                    const branchesRes = await getBranches();
                    setBranches(branchesRes.data);
                }

                const [statsRes, perfRes] = await Promise.all([
                    getDashboardStats(branchParam),
                    getPerformance(branchParam)
                ]);

                setStats({
                    todayRevenue: statsRes.data.today_revenue || 0,
                    monthlyRevenue: statsRes.data.monthly_revenue || 0,
                    todayTransactions: statsRes.data.today_transactions || 0
                });
                setLowStockItems(statsRes.data.low_stock_items || []);
                setPerformance(perfRes.data);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [selectedBranch]);

    const userName = user?.name?.split(' ')[0] || 'Admin';
    const { lang, switchLang } = useLanguage();

    return (
        <>
            <header className="h-20 px-8 flex items-center justify-between bg-background-light/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-text-main tracking-tight">{t('overview')}</h2>
                        <p className="text-sm text-text-muted">{t('welcome_back')}, {userName}</p>
                    </div>
                    <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                        <button
                            onClick={() => switchLang('en')}
                            className={`px-3.5 py-1.5 rounded-md text-sm font-semibold transition-all ${lang === 'en' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => switchLang('mm')}
                            className={`px-3.5 py-1.5 rounded-md text-sm font-semibold transition-all ${lang === 'mm' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            မြန်မာ
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    {user?.role === 'admin' && branches.length > 0 && (
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-primary focus:border-primary shadow-sm"
                        >
                            <option value="">{t('all_branches')}</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    )}

                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-8 pt-2 pb-20">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                        <span className="material-symbols-outlined text-4xl animate-spin mr-3">refresh</span>
                        <span>{t('loading')}</span>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-surface-light p-6 rounded-2xl shadow-soft border border-slate-100 flex flex-col justify-between group hover:border-primary/20 transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                        <span className="material-symbols-outlined">payments</span>
                                    </div>
                                    <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                        {t('today')}
                                        <span className="material-symbols-outlined text-[14px] ml-0.5">trending_up</span>
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-text-muted font-medium mb-1">{t('today_sales')}</p>
                                    <h3 className="text-2xl font-bold text-text-main">{parseFloat(stats?.todayRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} MMK</h3>
                                </div>
                            </div>
                            <div className="bg-surface-light p-6 rounded-2xl shadow-soft border border-slate-100 flex flex-col justify-between group hover:border-primary/20 transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                        <span className="material-symbols-outlined">calendar_month</span>
                                    </div>
                                    <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                        {t('monthly')}
                                        <span className="material-symbols-outlined text-[14px] ml-0.5">trending_up</span>
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-text-muted font-medium mb-1">{t('monthly_revenue')}</p>
                                    <h3 className="text-2xl font-bold text-text-main">{parseFloat(stats?.monthlyRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} MMK</h3>
                                </div>
                            </div>
                            <div className="bg-surface-light p-6 rounded-2xl shadow-soft border border-slate-100 flex flex-col justify-between group hover:border-primary/20 transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                                        <span className="material-symbols-outlined">receipt_long</span>
                                    </div>
                                    <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                        {t('today')}
                                        <span className="material-symbols-outlined text-[14px] ml-0.5">trending_up</span>
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-text-muted font-medium mb-1">{t('today_transactions')}</p>
                                    <h3 className="text-2xl font-bold text-text-main">{stats?.todayTransactions || 0}</h3>
                                </div>
                            </div>
                            <div className="bg-surface-light p-6 rounded-2xl shadow-soft border border-slate-100 flex flex-col justify-between group hover:border-rose-200 transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-rose-50 rounded-xl text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
                                        <span className="material-symbols-outlined">notification_important</span>
                                    </div>
                                    {lowStockItems.length > 0 && (
                                        <span className="flex items-center text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                                            Action needed
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-text-muted font-medium mb-1">{t('low_stock_alert')}</p>
                                    <h3 className="text-2xl font-bold text-text-main">{lowStockItems.length} {t('items')}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-surface-light rounded-2xl shadow-soft border border-slate-100 p-6 flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-text-main">{t('product')} Performance</h3>
                                        <p className="text-sm text-text-muted">Sales velocity groups</p>
                                    </div>
                                    <button className="text-sm font-semibold text-primary hover:text-blue-700">View Details</button>
                                </div>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Best Selling */}
                                    <div className="flex flex-col bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="material-symbols-outlined text-emerald-600 text-[20px]">local_fire_department</span>
                                            <h4 className="font-bold text-slate-800">{t('best_selling')}</h4>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {performance.bestSelling.length > 0 ? performance.bestSelling.map(item => (
                                                <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                                    <div className="min-w-0 pr-2">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                                                        <p className="text-xs text-slate-500">{item.total_sold} sold</p>
                                                    </div>
                                                    <span className="text-emerald-600 text-[10px] uppercase tracking-wider font-bold bg-emerald-50 px-2 py-1 rounded shrink-0">High</span>
                                                </div>
                                            )) : (
                                                <div className="text-center py-4 text-slate-400 text-sm italic">Not enough data</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Normal */}
                                    <div className="flex flex-col bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="material-symbols-outlined text-blue-600 text-[20px]">trending_flat</span>
                                            <h4 className="font-bold text-slate-800">{t('normal_selling')}</h4>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {performance.normal.length > 0 ? performance.normal.map(item => (
                                                <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                                    <div className="min-w-0 pr-2">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                                                        <p className="text-xs text-slate-500">{item.total_sold} sold</p>
                                                    </div>
                                                    <span className="text-blue-600 text-[10px] uppercase tracking-wider font-bold bg-blue-50 px-2 py-1 rounded shrink-0">Avg</span>
                                                </div>
                                            )) : (
                                                <div className="text-center py-4 text-slate-400 text-sm italic">No products</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Less Selling */}
                                    <div className="flex flex-col bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="material-symbols-outlined text-slate-500 text-[20px]">trending_down</span>
                                            <h4 className="font-bold text-slate-800">{t('less_selling')}</h4>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {performance.lessSelling.length > 0 ? performance.lessSelling.map(item => (
                                                <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                                    <div className="min-w-0 pr-2">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                                                        <p className="text-xs text-slate-500">{item.total_sold} sold</p>
                                                    </div>
                                                    <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold bg-slate-100 px-2 py-1 rounded shrink-0">Low</span>
                                                </div>
                                            )) : (
                                                <div className="text-center py-4 text-slate-400 text-sm italic">No products</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-1 bg-surface-light rounded-2xl shadow-soft border border-slate-100 p-0 flex flex-col h-full">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-text-main">{t('low_stock_alert')}</h3>
                                    <a className="text-xs font-semibold text-primary hover:text-blue-700" href="/products">View All</a>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                    <div className="flex flex-col gap-4">
                                        {lowStockItems.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400">
                                                <span className="material-symbols-outlined text-3xl mb-2 opacity-50">inventory_2</span>
                                                <p className="text-sm">{t('no_low_stock')}</p>
                                            </div>
                                        ) : (
                                            lowStockItems.map((item) => (
                                                <div key={`${item.id}-${item.branch_id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                                        <span className="material-symbols-outlined">checkroom</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-semibold text-text-main truncate">{item.product_name}</h4>
                                                        <p className="text-xs text-text-muted">{item.size} • {item.color}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-rose-600">{item.stock_quantity} left</p>
                                                        <p className="text-[10px] text-text-muted">{item.branch_name ? `${item.branch_name} • ` : ''}SKU: {item.sku || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-100">
                                    <a href="/products" className="block w-full py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-all text-center">Manage Inventory</a>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default Dashboard;
