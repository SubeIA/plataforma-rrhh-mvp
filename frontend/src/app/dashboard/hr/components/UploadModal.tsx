"use client";
import { useState, useEffect } from "react";

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userId: number, name: string, url: string) => Promise<void>;
    users: any[];
}

export default function UploadModal({ isOpen, onClose, onSubmit, users }: UploadModalProps) {
    const [userId, setUserId] = useState<number | "">("");
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");

    useEffect(() => {
        if (isOpen) {
            setUserId("");
            setName("");
            setUrl("");
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (userId === "") return;
        await onSubmit(Number(userId), name, url);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Subir Documento</h3>
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
                        <label className="block text-sm font-medium text-gray-700">Nombre del Documento</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Contrato, Anexo..."
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">URL del Documento (Simulado)</label>
                        <input
                            type="text"
                            required
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="http://..."
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Subir</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
