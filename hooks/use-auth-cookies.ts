import { useCallback } from 'react';
import { setCookieFromSession, clearAuthCookie } from '@/utils/api/client';

export function useAuthCookies() {
    const refreshAuthCookie = useCallback(async () => {
        try {
            await setCookieFromSession();
        } catch (error) {
            console.error('Failed to refresh authentication cookie:', error);
            throw error;
        }
    }, []);

    const clearAuthCookies = useCallback(async () => {
        try {
            await clearAuthCookie();
        } catch (error) {
            console.error('Failed to clear authentication cookie:', error);
            throw error;
        }
    }, []);

    return {
        refreshAuthCookie,
        clearAuthCookies,
    };
} 