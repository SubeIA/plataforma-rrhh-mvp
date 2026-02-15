"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import CorrectionModal from "./components/CorrectionModal";
import ManualEntryModal from "./components/ManualEntryModal";
import UploadModal from "./components/UploadModal";

export default function HRPage() {
    const { user, protectRoute, loading } = useAuth();
    const [attendance, setAttendance] = useState([]);
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        userId: ""
    });
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Fetch Attendance with Filters
    const fetchAttendance = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.append("startDate", filters.startDate);
        if (filters.endDate) queryParams.append("endDate", filters.endDate);
        if (filters.userId) queryParams.append("userId", filters.userId);

        try {
            const res = await fetch(`http://localhost:3001/api/attendance?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setAttendance(data);
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    };

    const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3001/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }

    useEffect(() => {
        protectRoute();
        if (user && (user?.role === 'admin' || user?.role === 'hr')) {
            fetchAttendance();
            fetchUsers();
        }
    }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAttendance();
    };

    const openCorrection = (record: any) => {
        setSelectedRecord(record);
        setIsCorrectionOpen(true);
    };

    const handleSaveCorrection = async (id: number, type: string, timestamp: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3001/api/attendance/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type, timestamp })
            });
            if (!res.ok) throw new Error("Update failed");
            fetchAttendance();
        } catch (error) {
            console.error("Error updating record:", error);
            alert("Error al actualizar el registro.");
        }
    };

    const handleManualEntry = async (userId: number, type: string, timestamp: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3001/api/attendance/manual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, type, timestamp })
            });
            if (!res.ok) throw new Error("Manual entry failed");
            fetchAttendance();
        } catch (error) {
            console.error("Error creating manual record:", error);
            alert("Error al crear registro manual.");
        }
    };

    const handleUploadDocument = async (userId: number, name: string, url: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3001/api/documents/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, name, url })
            });
            if (!res.ok) throw new Error("Upload failed");
            alert("Documento asignado correctamente.");
        } catch (error) {
            console.error("Error uploading document:", error);
            alert("Error al asignar documento.");
        }
    };

    if (loading) return <p className="p-8">Cargando...</p>;
    if (!user || (user?.role !== 'admin' && user?.role !== 'hr')) {
        if (!loading && user) return <p className="p-8 text-red-600">No tienes permisos de RRHH.</p>;
        return null;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Recursos Humanos</h1>

            {/* Stats / Quick Actions Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Empleados</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Asistencias Hoy</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{attendance.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow flex flex-col justify-center space-y-2">
                    <button
                        onClick={() => setIsManualOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 w-full"
                    >
                        + Registrar Asistencia
                    </button>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
                    >
                        + Subir Documento
                    </button>
                </div>
            </div>

            {/* Attendance Management */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6 pb-2 border-b">Control de Asistencia General</h2>

                {/* Filters */}
                <form onSubmit={handleSearch} className="flex flex-wrap gap-4 mb-6 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="border border-gray-300 rounded-md p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="border border-gray-300 rounded-md p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Usuario</label>
                        <input type="text" name="userId" placeholder="ID opcional" value={filters.userId} onChange={handleFilterChange} className="border border-gray-300 rounded-md p-2 w-24" />
                    </div>
                    <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">Filtrar</button>
                </form>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {attendance.map((rec: any) => (
                                <tr key={rec.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{rec.fullName || "Sin nombre"}</div>
                                        <div className="text-sm text-gray-500">{rec.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {rec.department || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rec.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {rec.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(rec.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openCorrection(rec)} className="text-indigo-600 hover:text-indigo-900">Corregir</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <CorrectionModal
                isOpen={isCorrectionOpen}
                onClose={() => setIsCorrectionOpen(false)}
                onSubmit={handleSaveCorrection}
                record={selectedRecord}
            />

            <ManualEntryModal
                isOpen={isManualOpen}
                onClose={() => setIsManualOpen(false)}
                onSubmit={handleManualEntry}
                users={users}
            />

            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onSubmit={handleUploadDocument}
                users={users}
            />
        </div>
    );
}
