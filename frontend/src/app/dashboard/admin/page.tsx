"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { auth, app } from "@/config/firebase";
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    query,
    orderBy,
    limit,
} from "firebase/firestore";
import {
    initializeApp,
    getApps,
    deleteApp,
} from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
} from "firebase/auth";
import UserModal from "./components/UserModal";
import { useToast } from "@/context/ToastContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Users, History, UserPlus, Edit3, Trash2, Shield, LayoutGrid, List, MapPin } from "lucide-react";

const db = getFirestore(app);

export default function AdminPage() {
    const { user, protectRoute, loading } = useAuth();
    const { hasPermission } = usePermissions();
    const toast = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [fetchError, setFetchError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchUsers = async () => {
        try {
            const usersSnap = await getDocs(collection(db, 'users'));
            const userList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setUsers(userList);
        } catch (error) {
            console.error("Error fetching users:", error);
            setFetchError("No se pudieron cargar los usuarios desde Firestore.");
        }
    };

    const fetchAttendance = async () => {
        try {
            const q = query(
                collection(db, 'attendance_logs'),
                orderBy('timestamp', 'desc'),
                limit(30)
            );
            const snap = await getDocs(q);
            const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAttendance(records);
        } catch (error: any) {
            // Si falta un índice, Firestore devuelve un link para crearlo. Lo mostramos.
            if (error?.message?.includes('index')) {
                console.warn("Índice Firestore faltante para attendance_logs. Creando query sin orderBy...");
                // Fallback: sin ordenamiento para no bloquear la carga
                try {
                    const snap = await getDocs(collection(db, 'attendance_logs'));
                    const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    // Ordenar manualmente y tomar los últimos 30
                    records.sort((a: any, b: any) => {
                        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                        return tb - ta;
                    });
                    setAttendance(records.slice(0, 30));
                } catch (e2) {
                    console.error("Error fetching attendance fallback:", e2);
                }
            } else {
                console.error("Error fetching attendance:", error);
            }
        }
    };

    useEffect(() => {
        protectRoute();
        if (user && hasPermission('manage_users')) {
            fetchUsers();
            fetchAttendance();
        }
    }, [user, loading]);

    const handleCreateUser = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (u: any) => {
        setEditingUser(u);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("¿Estás seguro? El usuario quedará marcado como inactivo.")) return;
        try {
            await updateDoc(doc(db, 'users', userId), { status: 'inactive' });
            fetchUsers();
        } catch (error) {
            console.error("Error deactivating user:", error);
        }
    };

    const handleSaveUser = async (formData: any) => {
        setIsSaving(true);
        try {
            if (editingUser) {
                // Editar: solo actualizar campos en Firestore (no cambiar contraseña desde aquí)
                const { password, ...dataWithoutPassword } = formData;
                await updateDoc(doc(db, 'users', editingUser.id), {
                    ...dataWithoutPassword,
                    updatedAt: new Date().toISOString(),
                });
            } else {
                // Crear: usar una app secundaria de Firebase para no perder la sesión del admin
                const secondaryAppName = `secondary-${Date.now()}`;
                const secondaryApp = initializeApp(app.options, secondaryAppName);
                const secondaryAuth = getAuth(secondaryApp);

                try {
                    const cred = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
                    const newUid = cred.user.uid;

                    // Guardar perfil en Firestore
                    await setDoc(doc(db, 'users', newUid), {
                        uid: newUid,
                        email: formData.email,
                        fullName: formData.fullName || '',
                        role: formData.role || 'user',
                        department: formData.department || '',
                        position: formData.position || '',
                        phone: formData.phone || '',
                        address: formData.address || '',
                        startDate: formData.startDate || '',
                        status: 'active',
                        permissions: formData.permissions || [],
                        createdAt: new Date().toISOString(),
                    });
                } finally {
                    // Siempre limpiar la app secundaria
                    await deleteApp(secondaryApp);
                }
            }

            await fetchUsers();
            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Error saving user:", error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error("Ese correo ya está registrado en Firebase Auth.");
            } else {
                toast.error("Error al guardar usuario: " + (error.message || 'Intenta de nuevo.'));
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    if (!user || !hasPermission('manage_users')) {
        if (!loading && user) return (
            <div className="p-8 max-w-lg mx-auto mt-20 glass-card rounded-2xl text-center border-rose-100">
                <Shield className="mx-auto text-rose-500 mb-4" size={48} />
                <h1 className="text-2xl font-bold text-rose-700">Acceso Restringido</h1>
                <p className="text-gray-600 mt-2">No tienes permisos para organizar empleados.</p>
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
                                                    {(u.fullName || u.email || '?').substring(0, 2)}
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
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {u.role}
                                            </span>
                                            {u.status === 'inactive' && (
                                                <span className="ml-1 px-2 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-500">inactivo</span>
                                            )}
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
                                                title="Desactivar"
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

                {/* Activity Section */}
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
                                        {rec.timestamp ? new Date(rec.timestamp).toLocaleDateString('es-CL') : '-'}
                                        {rec.accuracy && (
                                            <span className="ml-2 lowercase font-normal italic">
                                                (±{Math.round(rec.accuracy)}m)
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm font-bold text-indigo-600">
                                        {rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
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
                isSaving={isSaving}
            />
        </div>
    );
}
