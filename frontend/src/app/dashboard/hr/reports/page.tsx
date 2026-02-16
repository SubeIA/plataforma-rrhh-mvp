"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ReportsPage() {
    const { user, protectRoute, loading } = useAuth();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reportData, setReportData] = useState([]);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        protectRoute();
    }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

    const generateReport = async () => {
        if (!startDate || !endDate) {
            alert("Seleccione rango de fechas");
            return;
        }
        setFetching(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/reports/payroll?startDate=${startDate}&endDate=${endDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setReportData(data);
            } else {
                alert("Error generando reporte");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setFetching(false);
        }
    };

    const downloadCSV = () => {
        if (reportData.length === 0) return;

        const headers = ["ID", "Email", "Nombre", "Departamento", "Días Trabajados", "Horas Totales"];
        const csvRows = [];
        csvRows.push(headers.join(","));

        reportData.forEach((row: any) => {
            const values = [
                row.id,
                row.email,
                `"${row.fullName}"`, // quote strings with spaces
                row.department,
                row.daysWorked,
                row.totalHours
            ];
            csvRows.push(values.join(","));
        });

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reporte_nomina_${startDate}_${endDate}.csv`;
        a.click();
    };

    if (loading) return <p className="p-8">Cargando...</p>;
    if (!user || (user.role !== 'admin' && user.role !== 'hr')) return <p className="p-8 text-red-600">Acceso Denegado</p>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Reportes y Nómina</h1>

            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full border p-2 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha Fin</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full border p-2 rounded"
                        />
                    </div>
                    <button
                        onClick={generateReport}
                        disabled={fetching}
                        className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {fetching ? "Generando..." : "Generar Reporte"}
                    </button>
                    <button
                        onClick={downloadCSV}
                        disabled={reportData.length === 0}
                        className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 disabled:bg-gray-400"
                    >
                        Exportar a Excel (CSV)
                    </button>
                </div>
            </div>

            {reportData.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días Trabajados</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horas Totales Absolutas</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.map((row: any) => (
                                <tr key={row.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{row.fullName}</div>
                                        <div className="text-sm text-gray-500">{row.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.daysWorked}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{row.totalHours} hrs</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
