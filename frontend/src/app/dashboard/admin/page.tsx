"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import UserModal from "./components/UserModal";

export default function AdminPage() {
    const { user, protectRoute, loading } = useAuth();
    const [users, setUsers] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('http://localhost:3001/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchAttendance = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('http://localhost:3001/api/attendance/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setAttendance(data);
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    }

    useEffect(() => {
        protectRoute();
        if (user && user?.role === 'admin') {
            fetchUsers();
            fetchAttendance();
        }
    }, [user, loading]);

    const handleCreateUser = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: any) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`http://localhost:3001/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const handleSaveUser = async (formData: any) => {
        const token = localStorage.getItem('token');
        const url = editingUser
            ? `http://localhost:3001/api/users/${editingUser.id}`
            : 'http://localhost:3001/api/users';
        const method = editingUser ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Failed to save user");

            fetchUsers();
        } catch (error) {
            console.error("Error saving user:", error);
            alert("Error al guardar usuario");
        }
    };

    if (loading) return <p className="p-8">Cargando...</p>;
    if (!user || user?.role !== 'admin') {
        if (!loading && user) return <p className="p-8 text-red-600">No tienes permisos de administrador.</p>;
        return null;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Users Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-xl font-semibold text-gray-800">Gestión de Usuarios</h2>
                        <button
                            onClick={handleCreateUser}
                            className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-sm"
                        >
                            + Nuevo Usuario
                        </button>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre / Email</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Depto / Cargo</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((u: any) => (
                                    <tr key={u.id}>
                                        <td className="px-4 py-2 text-sm">
                                            <div className="font-medium text-gray-900">{u.fullName || "Sin nombre"}</div>
                                            <div className="text-gray-500 text-xs">{u.email}</div>
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <div className="text-gray-900">{u.department || "-"}</div>
                                            <div className="text-gray-500 text-xs">{u.position}</div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">{u.role}</td>
                                        <td className="px-4 py-2 text-sm text-right space-x-2">
                                            <button onClick={() => handleEditUser(u)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Reports Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Reportes de Asistencia</h2>
                    <div className="mt-4 overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {attendance.map((rec: any) => (
                                    <tr key={rec.id}>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{rec.email}</td>
                                        <td className="px-4 py-2 text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rec.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {rec.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                            {new Date(rec.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveUser}
                initialData={editingUser}
            />
        </div>
    );
}
