"use client";
import { useState, useEffect } from "react";
import { PERMISSIONS, ALL_PERMISSIONS, Permission } from "@/constants/permissions";

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userData: any) => Promise<void>;
    initialData?: any;
    isSaving?: boolean;
}

export default function UserModal({ isOpen, onClose, onSubmit, initialData, isSaving = false }: UserModalProps) {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "user",
        fullName: "",
        phone: "",
        address: "",
        department: "",
        position: "",
        startDate: "",
        permissions: [] as Permission[]
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                email: initialData.email || "",
                password: "", // Don't populate password on edit
                role: initialData.role || "user",
                fullName: initialData.fullName || "",
                phone: initialData.phone || "",
                address: initialData.address || "",
                department: initialData.department || "",
                position: initialData.position || "",
                startDate: initialData.startDate || "",
                permissions: initialData.permissions || []
            });
        } else {
            setFormData({
                email: "",
                password: "",
                role: "user",
                fullName: "",
                phone: "",
                address: "",
                department: "",
                position: "",
                startDate: "",
                permissions: []
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePermissionToggle = (permission: Permission) => {
        setFormData(prev => {
            const hasPerm = prev.permissions.includes(permission);
            return {
                ...prev,
                permissions: hasPerm
                    ? prev.permissions.filter(p => p !== permission)
                    : [...prev.permissions, permission]
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {initialData ? "Editar Usuario" : "Nuevo Usuario"}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input name="email" type="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input name="password" type="password" required={!initialData} value={formData.password} onChange={handleChange} placeholder={initialData ? "(Sin cambios)" : ""} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Rol Base (Estructural)</label>
                                <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                    <option value="user">Usuario Estándar</option>
                                    <option value="admin">Administrador Entidad</option>
                                    <option value="super_admin">Super Administrador Plataforma</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                                <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                                <input name="phone" type="text" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Departamento</label>
                                <input name="department" type="text" value={formData.department} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cargo</label>
                                <input name="position" type="text" value={formData.position} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
                                <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Dirección</label>
                                <input name="address" type="text" value={formData.address} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>

                            {/* Seccion de Permisos Granulares */}
                            <div className="col-span-2 mt-4 pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900 mb-3">Permisos de Acceso Específico</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {ALL_PERMISSIONS.map(perm => (
                                        <label key={perm} className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer text-sm">
                                            <input
                                                type="checkbox"
                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                                checked={formData.permissions.includes(perm)}
                                                onChange={() => handlePermissionToggle(perm)}
                                                // Bloquear checkbox si el rol es admin (los admins suelen tener todo) -- Opcional
                                            />
                                            <span className="font-medium text-gray-700">
                                                {perm.replace(/_/g, ' ')}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50">Cancelar</button>
                            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                                {isSaving && <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
