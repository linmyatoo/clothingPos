'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { lang, switchLang, t } = useLanguage();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const response = await login(credentials);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user || {}));
            const userRole = response.data.user?.role;
            router.push(userRole === 'employee' ? '/pos' : '/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="font-display bg-background-light dark:bg-background-dark min-h-screen flex flex-col text-slate-900 dark:text-slate-100 overflow-x-hidden">
            {/* Top Navigation */}
            <header className="w-full flex items-center justify-between px-6 py-4 md:px-10 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-primary text-white">
                        <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>Youth Fashion Shop</h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                        <button
                            onClick={() => switchLang('en')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => switchLang('mm')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${lang === 'mm' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            မြန်မာ
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
                {/* Abstract Background Pattern */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[100px]"></div>
                </div>

                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 z-10 animate-fade-in-up">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 mb-4 text-primary">
                            <span className="material-symbols-outlined text-[32px]">lock</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">{t('welcome_login')}</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{t('login_subtitle')}</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">{t('email')}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </div>
                                <input
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={credentials.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">{t('password')}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <span className="material-symbols-outlined text-[20px]">key</span>
                                </div>
                                <input
                                    className="block w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={credentials.password}
                                    onChange={handleChange}
                                    required
                                />
                                <div 
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? t('logging_in') : t('login')}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-slate-400">
                        Protected by reCAPTCHA and subject to the
                        <a className="underline hover:text-slate-500 ml-1" href="#">Privacy Policy</a> and
                        <a className="underline hover:text-slate-500 ml-1" href="#">Terms of Service</a>.
                    </p>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                <p>© 2026 <span style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>Youth Fashion Shop</span>. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Login;
