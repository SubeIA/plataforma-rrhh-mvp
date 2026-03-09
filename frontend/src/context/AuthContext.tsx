"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../config/firebase';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const db = getFirestore(auth.app);

interface User {
    uid: string;
    email: string;
    role: string;
    companyId: string | null;
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    role: "super_admin" | "admin" | "hr" | "jefatura" | "user" | null;
    companyId: string | null;
    loading: boolean;
    login: (email: string, password: any) => Promise<boolean>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    protectRoute: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [role, setRole] = useState<"super_admin" | "admin" | "hr" | "jefatura" | "user" | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Escuchador persistente de Firebase
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                try {
                    // Force refresh token using getToken
                    const jwt = await firebaseUser.getIdToken();
                    setToken(jwt);

                    // Get user role from Firestore
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    let userRole: string = "user";
                    let userCompanyId: string | null = null;

                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        userRole = data.role || "user";
                        userCompanyId = data.companyId || null;
                    } else {
                        console.warn('Usuario no encontrado en la colección users. Usando rol por defecto "user".');
                    }

                    setRole(userRole as any);
                    setCompanyId(userCompanyId);
                    // Persist role so the sidebar can read it synchronously on next render
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('lastKnownRole', userRole);
                    }
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        role: userRole,
                        companyId: userCompanyId,
                    });
                } catch (e) {
                    console.error("Error al obtener perfil o token desde Firestore", e);
                    setRole(null);
                    setToken(null);
                    setUser(null);
                }
            } else {
                setUser(null);
                setRole(null);
                setToken(null);
                setCompanyId(null);
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('lastKnownRole');
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: any) => {
        try {
            // Firebase Auth Login
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
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

    const resetPassword = async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error: any) {
            console.error("Password Reset Error", error);
            throw new Error(error.message || 'Error al enviar correo de recuperación');
        }
    };

    const protectRoute = () => {
        if (!loading && !user) {
            router.push('/');
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, role, companyId, loading, login, logout, resetPassword, protectRoute }}>
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
