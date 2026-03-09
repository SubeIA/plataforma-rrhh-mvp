import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import ToastContainer from "@/components/ui/ToastContainer";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Control de Asistencia",
    description: "Plataforma de gestión de asistencia y RRHH",
};


export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <ErrorBoundary>
                    <ToastProvider>
                        <AuthProvider>
                            {children}
                        </AuthProvider>
                        <ToastContainer />
                    </ToastProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}
