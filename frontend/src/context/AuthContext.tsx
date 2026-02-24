"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: any) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
    protectRoute: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // User data (non-sensitive) still in localStorage for UI state
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch {
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: any) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Login failed');
            }

            const data = await res.json();
            // Token is now in httpOnly cookie (not accessible via JS)
            // Only store non-sensitive user info for UI
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            router.push('/selection');
            return true;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch {
            // Continue logout even if API call fails
        }
        localStorage.removeItem('user');
        setUser(null);
        router.push('/');
    };

    const protectRoute = () => {
        if (!loading && !user) {
            router.push('/');
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, protectRoute }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
