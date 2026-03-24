'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

function Navbar({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { lang, switchLang, t } = useLanguage();

    useEffect(() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            setUser(u);
        } catch (e) { }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const isAdmin = user?.role === 'admin';

    const adminNavItems = [
        { to: '/dashboard', icon: 'dashboard', label: t('nav_dashboard') },
        { to: '/products', icon: 'shopping_bag', label: t('nav_products') },
        { to: '/employees', icon: 'group', label: t('nav_employees') },
        { to: '/branches', icon: 'store', label: t('nav_branches') },
        { to: '/reports', icon: 'bar_chart', label: t('nav_reports') },
        { to: '/pos', icon: 'point_of_sale', label: t('nav_pos') },
    ];

    const employeeNavItems = [
        { to: '/pos', icon: 'point_of_sale', label: t('nav_pos') },
    ];

    const navItems = isAdmin ? adminNavItems : employeeNavItems;

    return (
        <div className="bg-background-light text-slate-900 font-display min-h-screen overflow-x-hidden flex h-screen w-full">
            {isAdmin && (
                <aside className="w-72 flex-shrink-0 flex flex-col justify-between bg-white border-r border-slate-100 h-full p-6 z-20 hidden md:flex">
                    <div className="flex flex-col gap-8">
                        <div className="flex items-center gap-3 px-2">
                            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                <span className="material-symbols-outlined text-2xl">storefront</span>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-slate-900 text-lg font-bold leading-tight" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>Youth Fashion Shop</h1>
                                <p className="text-slate-500 text-xs font-medium" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>{isAdmin ? t('pos_admin') : t('pos_cashier')}</p>
                            </div>
                        </div>
                        <nav className="flex flex-col gap-2">
                            {navItems.map(item => {
                                const isActive = pathname === item.to;
                                return (
                                    <Link
                                        key={item.to}
                                        href={item.to}
                                        className={
                                            isActive
                                                ? 'group flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary transition-all duration-200'
                                                : 'group flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-primary transition-all duration-200'
                                        }
                                    >
                                        <span className={`material-symbols-outlined text-[24px]${isActive ? ' fill-1' : ''}`}>
                                            {item.icon}
                                        </span>
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                );
                            })}

                        </nav>
                    </div>
                    <div className="px-2 border-t border-slate-100 pt-4 mt-auto">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                        >
                            <span className="material-symbols-outlined text-[24px]">logout</span>
                            <span className="font-medium">{t('nav_logout')}</span>
                        </button>
                    </div>
                </aside>
            )}
            {/* Mobile Sidebar Overlay */}
            {isAdmin && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden transition-all duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                >
                    <div
                        className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col justify-between p-6 transform transition-transform duration-300 ease-in-out"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex flex-col gap-8">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                        <span className="material-symbols-outlined text-2xl">storefront</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <h1 className="text-slate-900 text-lg font-bold leading-tight" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>Youth Fashion</h1>
                                        <p className="text-slate-500 text-xs font-medium" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>{isAdmin ? t('pos_admin') : t('pos_cashier')}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-900">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <nav className="flex flex-col gap-2">
                                {navItems.map(item => {
                                    const isActive = pathname === item.to;
                                    return (
                                        <Link
                                            key={item.to}
                                            href={item.to}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={
                                                isActive
                                                    ? 'group flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary transition-all duration-200'
                                                    : 'group flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-primary transition-all duration-200'
                                            }
                                        >
                                            <span className={`material-symbols-outlined text-[24px]${isActive ? ' fill-1' : ''}`}>
                                                {item.icon}
                                            </span>
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                        <div className="px-2 border-t border-slate-100 pt-4 mt-auto">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                            >
                                <span className="material-symbols-outlined text-[24px]">logout</span>
                                <span className="font-medium">{t('nav_logout')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-light relative">
                {/* Mobile Header Topbar */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 z-10 w-full flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-sm">
                            <span className="material-symbols-outlined text-lg">storefront</span>
                        </div>
                        <h1 className="text-slate-900 text-md font-bold leading-tight flex-1 truncate" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>Youth Fashion Shop</h1>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -mr-2 text-slate-500 hover:text-primary transition-colors flex-shrink-0"
                        >
                            <span className="material-symbols-outlined text-[24px]">menu</span>
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default Navbar;
