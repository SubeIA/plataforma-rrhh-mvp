"use client";
import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { auth } from "@/config/firebase";
import { UserPlus, MoreVertical, Edit2, Shield, User } from "lucide-react";

const db = getFirestore(auth.app);

interface UserDoc {
    id: string;
    uid: string;
    name: string;
    email: string;
    rut: string;
    role: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserDoc[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersCol = collection(db, "users");
                const userSnapshot = await getDocs(usersCol);
                const userList = userSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as UserDoc[];
                setUsers(userList);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleChangeRole = async (userId: string, newRole: string) => {
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { role: newRole });

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error("Error updating role:", error);
            alert("No se pudo actualizar el rol");
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Gestión de Usuarios</h1>
                    <p className="text-slate-500 mt-1">Administra accesos, roles y datos de los colaboradores</p>
                </div>
                <button className="premium-button flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors">
                    <UserPlus size={18} />
                    <span>Nuevo Usuario</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">RUT</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Rol (RBAC)</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex justify-center mb-4">
                                            <div className="h-6 w-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                        </div>
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        No hay usuarios registrados en la base de datos.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                    {u.name ? u.name.charAt(0).toUpperCase() : <User size={18} />}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900">{u.name || "Sin nombre"}</div>
                                                    <div className="text-sm text-slate-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {u.rut || "N/A"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                className={`text-sm font-semibold px-3 py-1.5 rounded-full border-0 outline-none cursor-pointer
                                                    ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                                                        u.role === 'Jefatura' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-emerald-100 text-emerald-700'}`}
                                                value={u.role || 'Usuario'}
                                                onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                            >
                                                <option value="Usuario">Usuario</option>
                                                <option value="Jefatura">Jefatura</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <MoreVertical size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
