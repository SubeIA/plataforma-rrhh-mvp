import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Control de Asistencia",
    description: "Plataforma de gestión de asistencia y RRHH",
};

import ErrorBoundary from "@/components/ErrorBoundary";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <ErrorBoundary>
                    <AuthProvider>{children}</AuthProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}
