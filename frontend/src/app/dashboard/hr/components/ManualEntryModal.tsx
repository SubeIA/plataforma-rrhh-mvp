"use client";
import { useState, useEffect } from "react";

interface ManualEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userId: number, type: string, timestamp: string) => Promise<void>;
    users: any[]; // List of users to select from
}

export default function ManualEntryModal({ isOpen, onClose, onSubmit, users }: ManualEntryModalProps) {
    const [userId, setUserId] = useState<number | "">("");
    const [type, setType] = useState("IN");
    const [timestamp, setTimestamp] = useState("");

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setUserId("");
            setType("IN");
            setTimestamp(new Date().toISOString().slice(0, 16));
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (userId === "") return;

        const isoDate = new Date(timestamp).toISOString();
        await onSubmit(Number(userId), type, isoDate);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Registro Manual de Asistencia</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Empleado</label>
                        <select
                            value={userId}
                            onChange={(e) => setUserId(Number(e.target.value))}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        >
                            <option value="">Seleccione un empleado...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.fullName || u.email}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            <option value="IN">Entrada</option>
                            <option value="OUT">Salida</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha y Hora</label>
                        <input
                            type="datetime-local"
                            required
                            value={timestamp}
                            onChange={(e) => setTimestamp(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
