'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        // Skip login — always go to dashboard
        router.replace('/dashboard');
    }, [router]);

    return null;
}
