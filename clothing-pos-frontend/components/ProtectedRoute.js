'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

function ProtectedRoute({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token) {
            router.push('/login');
            return;
        }

        // Employees can only access POS page
        if (user.role === 'employee' && pathname !== '/pos') {
            router.push('/pos');
            return;
        }

        setChecked(true);
    }, [pathname, router]);

    if (!checked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
            </div>
        );
    }

    return children;
}

export default ProtectedRoute;
