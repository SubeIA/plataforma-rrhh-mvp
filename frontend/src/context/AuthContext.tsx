"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../config/firebase';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
    uid: string;
    email: string;
    role: string;
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
        // Escuchador persistente de Firebase
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                try {
                    // Si necesitamos refrescar o inyectar Rol, lo sacamos del backend
                    const token = await firebaseUser.getIdToken();

                    // Como Firebase Auth no tiene el "role" base a simple vista en el token, llamamos al backend
                    // Opcionalmente podemos saltar esto y usar datos básicos.
                    // Para MVP usaremos una llamada al me/login del backend solo para obtener info extra si la hubiera.
                    const res = await fetch(`${API_URL}/api/users/${firebaseUser.uid}/shift`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).catch(() => null); // Ignoramos si falla

                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        role: 'user', // Default hasta setear custom claims bien en backend, si es admin se puede manejar.
                    });
                } catch (e) {
                    console.error("Error al obtener perfil", e);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: any) => {
        try {
            // Firebase Auth Login
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/selection');
            return true;
        } catch (error: any) {
            console.error("Firebase Login Error", error);
            if (error.code === 'auth/invalid-credential') {
                throw new Error("Credenciales inválidas");
            }
            throw new Error(error.message || 'Error al iniciar sesión');
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error("Logout Error", error);
        }
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
