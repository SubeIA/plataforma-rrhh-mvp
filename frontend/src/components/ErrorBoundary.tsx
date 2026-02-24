"use client";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-[#010816]">
                    <div className="max-w-md w-full glass-card p-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">¡Ups! Algo salió mal</h2>
                            <p className="text-slate-400">
                                Ha ocurrido un error inesperado. Hemos notificado al equipo técnico.
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="bg-black/40 p-4 rounded-lg text-left overflow-auto max-h-40">
                                <code className="text-xs text-red-400 break-words">
                                    {this.state.error?.toString()}
                                </code>
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full premium-button flex items-center justify-center gap-2"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Recargar página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
