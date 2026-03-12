import './globals.css';
import { Inter } from 'next/font/google';
import { LanguageProvider } from '../context/LanguageContext';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata = {
    title: 'ClothingPOS',
    description: 'Clothing POS System',
};

export const viewport = {
    themeColor: '#6c63ff',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={inter.variable}>
            <head>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                />
            </head>
            <body>
                <LanguageProvider>{children}</LanguageProvider>
            </body>
        </html>
    );
}
