"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import UserModal from "./components/UserModal";
import { Users, History, UserPlus, Edit3, Trash2, Shield, LayoutGrid, List, MapPin } from "lucide-react";

export default function AdminPage() {
    const { user, protectRoute, loading } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [fetchError, setFetchError] = useState("");

    const fetchUsers = async () => {
        try {
            const res = await apiFetch('/api/users');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            setFetchError("No se pudieron cargar los datos. Verifique su sesión.");
        }
    };

    const fetchAttendance = async () => {
        try {
            const res = await apiFetch('/api/attendance/all');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setAttendance(data);
            } else {
                setAttendance([]);
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
            setFetchError("No se pudieron cargar los datos. Verifique su sesión.");
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
        try {
            await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const handleSaveUser = async (formData: any) => {
        const url = editingUser
            ? `/api/users/${editingUser.id}`
            : `/api/users`;
        const method = editingUser ? 'PUT' : 'POST';

        try {
            const res = await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Failed to save user");

            fetchUsers();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving user:", error);
            alert("Error al guardar usuario");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    if (!user || user?.role !== 'admin') {
        if (!loading && user) return (
            <div className="p-8 max-w-lg mx-auto mt-20 glass-card rounded-2xl text-center border-rose-100">
                <Shield className="mx-auto text-rose-500 mb-4" size={48} />
                <h1 className="text-2xl font-bold text-rose-700">Acceso Restringido</h1>
                <p className="text-gray-600 mt-2">No tienes permisos de administrador para ver esta sección.</p>
            </div>
        );
        return null;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto animate-in">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <Shield className="text-indigo-600" />
                        Panel de Administración
                    </h1>
                    <p className="text-gray-500 mt-2">Gestiona el equipo y supervisa la actividad global.</p>
                </div>
            </header>

            {fetchError && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 animate-in">
                    <Shield size={20} />
                    <p className="font-medium text-sm">{fetchError}</p>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Users Section */}
                <div className="xl:col-span-2 glass-card rounded-3xl p-8 overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <Users className="text-indigo-600" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Equipo</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-gray-100 p-1 rounded-lg flex mr-4">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}
                                >
                                    <LayoutGrid size={18} />
                                </button>
                            </div>
                            <button
                                onClick={handleCreateUser}
                                className="premium-button bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-indigo-100"
                            >
                                <UserPlus size={18} />
                                <span className="hidden sm:inline">Nuevo Usuario</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Colaborador</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Cargo / Depto</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Rol</th>
                                    <th className="px-4 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map((u: any) => (
                                    <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold uppercase">
                                                    {(u.fullName || u.email).substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{u.fullName || "Sin nombre"}</div>
                                                    <div className="text-gray-500 text-xs">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-gray-900 font-medium">{u.position || "-"}</div>
                                            <div className="text-gray-400 text-xs">{u.department}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right space-x-1">
                                            <button
                                                onClick={() => handleEditUser(u)}
                                                className="p-2 hover:bg-white rounded-lg text-indigo-400 hover:text-indigo-600 transition-all"
                                                title="Editar"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="p-2 hover:bg-white rounded-lg text-rose-400 hover:text-rose-600 transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="text-center py-20">
                                <Users size={48} className="mx-auto text-gray-100 mb-4" />
                                <p className="text-gray-400 font-medium">No hay usuarios registrados.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reports/Attendance Section */}
                <div className="glass-card rounded-3xl p-8 flex flex-col h-[700px]">
                    <div className="flex items-center gap-3 mb-8">
                        <History className="text-indigo-600" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Actividad</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                        {attendance.map((rec: any) => (
                            <div key={rec.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-100 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-gray-800 text-sm truncate max-w-[150px]">{rec.email}</div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${rec.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {rec.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                                        </span>
                                        {(!rec.lat || !rec.lng) ? (
                                            <span className="text-[9px] font-bold text-rose-500 flex items-center gap-0.5 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                                <MapPin size={8} /> Sin GPS
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                <MapPin size={8} /> GPS OK
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                        {new Date(rec.timestamp).toLocaleDateString()}
                                        {rec.accuracy && (
                                            <span className="ml-2 lowercase font-normal italic">
                                                (±{Math.round(rec.accuracy)}m)
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm font-bold text-indigo-600">
                                        {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {attendance.length === 0 && (
                            <div className="text-center py-20">
                                <History size={48} className="mx-auto text-gray-100 mb-4" />
                                <p className="text-gray-400 font-medium">Sin actividad reciente.</p>
                            </div>
                        )}
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
