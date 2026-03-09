"use client";
import { useState, useEffect } from "react";

interface CorrectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: number, type: string, timestamp: string) => Promise<void>;
    record: any;
}

export default function CorrectionModal({ isOpen, onClose, onSubmit, record }: CorrectionModalProps) {
    const [type, setType] = useState("IN");
    const [timestamp, setTimestamp] = useState("");

    useEffect(() => {
        if (record) {
            setType(record.type);
            // Format datetime-local input: YYYY-MM-DDTHH:mm
            const date = new Date(record.timestamp);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            setTimestamp(date.toISOString().slice(0, 16));
        }
    }, [record, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Convert local time back to ISO string for backend if needed, 
        // or backend handles it. usually passing ISO string is safest.
        const isoDate = new Date(timestamp).toISOString();
        await onSubmit(record.id, type, isoDate);
        onClose();
    };

    if (!isOpen || !record) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Corregir Asistencia</h3>
                <div className="mb-4 text-sm text-gray-600">
                    <p>Usuario: <strong>{record.email}</strong></p>
                    <p>Fecha original: {new Date(record.timestamp).toLocaleString('es-CL')}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            <option value="IN">Entrada</option>
                            <option value="OUT">Salida</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nueva Fecha/Hora</label>
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
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
