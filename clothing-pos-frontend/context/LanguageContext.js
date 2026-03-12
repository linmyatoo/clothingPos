'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../lib/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState('en');

    useEffect(() => {
        const saved = localStorage.getItem('lang');
        if (saved && translations[saved]) {
            setLang(saved);
        }
    }, []);

    const switchLang = (newLang) => {
        setLang(newLang);
        localStorage.setItem('lang', newLang);
    };

    const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

    return (
        <LanguageContext.Provider value={{ lang, switchLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
    return ctx;
}
