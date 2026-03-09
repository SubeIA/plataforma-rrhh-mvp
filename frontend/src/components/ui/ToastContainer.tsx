"use client";
import React from "react";
import { useToasts, ToastType } from "@/context/ToastContext";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

const STYLES: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
    success: {
        bg: "bg-emerald-50 text-emerald-800",
        border: "border-emerald-400",
        icon: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
    },
    error: {
        bg: "bg-red-50 text-red-800",
        border: "border-red-400",
        icon: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
    },
    info: {
        bg: "bg-blue-50 text-blue-800",
        border: "border-blue-400",
        icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    },
    warning: {
        bg: "bg-amber-50 text-amber-800",
        border: "border-amber-400",
        icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    },
};

export default function ToastContainer() {
    const toasts = useToasts();

    if (toasts.length === 0) return null;

    return (
        <div
            aria-live="polite"
            className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
        >
            {toasts.map((t) => {
                const style = STYLES[t.type];
                return (
                    <div
                        key={t.id}
                        className={`
                            flex items-start gap-3 px-4 py-3 rounded-xl border-l-4 shadow-lg
                            backdrop-blur-sm pointer-events-auto
                            animate-in slide-in-from-right-4 fade-in duration-300
                            ${style.bg} ${style.border}
                        `}
                    >
                        {style.icon}
                        <p className="text-sm font-medium leading-snug flex-1">{t.message}</p>
                    </div>
                );
            })}
        </div>
    );
}
