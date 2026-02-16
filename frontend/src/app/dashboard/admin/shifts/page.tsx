"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ShiftManagementPage() {
    const { user, protectRoute, loading } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [users, setUsers] = useState([]);

    // Create Shift State
    const [name, setName] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("18:00");
    const [tolerance, setTolerance] = useState(15);

    // Assign Shift State
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedShift, setSelectedShift] = useState("");
    const [assignStartDate, setAssignStartDate] = useState("");

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const [shiftsRes, usersRes] = await Promise.all([
                fetch('http://localhost:3001/api/shifts', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3001/api/users', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (shiftsRes.ok) setShifts(await shiftsRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        protectRoute();
        if (user && (user?.role === 'admin' || user?.role === 'hr')) {
            fetchData();
        }
    }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCreateShift = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/shifts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name, startTime, endTime, toleranceMinutes: tolerance })
            });
            if (res.ok) {
                alert("Turno creado");
                setName("");
                fetchData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAssignShift = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/shifts/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: selectedUser, shiftId: selectedShift, startDate: assignStartDate })
            });
            if (res.ok) {
                alert("Turno asignado correctamente");
                setSelectedUser("");
                setSelectedShift("");
                setAssignStartDate("");
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <p className="p-8">Cargando...</p>;
    if (!user || user?.role !== 'admin') return <p className="p-8 text-red-600">Acceso denegado</p>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Gestión de Turnos</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Create Shift */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Crear Nuevo Turno</h2>
                    <form onSubmit={handleCreateShift} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Nombre Turno</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" placeholder="Ej: Mañana" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Inicio</label>
                                <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border p-2 rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Fin</label>
                                <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border p-2 rounded" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Tolerancia (min)</label>
                            <input type="number" required value={tolerance} onChange={e => setTolerance(Number(e.target.value))} className="w-full border p-2 rounded" />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Crear Turno</button>
                    </form>

                    <div className="mt-8">
                        <h3 className="font-semibold mb-2">Turnos Existentes</h3>
                        <ul className="space-y-2">
                            {shifts.map((s: any) => (
                                <li key={s.id} className="border p-2 rounded bg-gray-50 flex justify-between">
                                    <span>{s.name}</span>
                                    <span className="text-gray-500 text-sm">{s.startTime} - {s.endTime}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Assign Shift */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Asignar Turno a Empleado</h2>
                    <form onSubmit={handleAssignShift} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Empleado</label>
                            <select required value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full border p-2 rounded">
                                <option value="">Seleccionar...</option>
                                {users.map((u: any) => (
                                    <option key={u.id} value={u.id}>{u.fullName || u.email}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Turno</label>
                            <select required value={selectedShift} onChange={e => setSelectedShift(e.target.value)} className="w-full border p-2 rounded">
                                <option value="">Seleccionar...</option>
                                {shifts.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Válido Desde</label>
                            <input type="date" required value={assignStartDate} onChange={e => setAssignStartDate(e.target.value)} className="w-full border p-2 rounded" />
                        </div>
                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Asignar Turno</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
