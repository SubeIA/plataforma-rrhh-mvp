// ─── Generic ─────────────────────────────────────────────────────────────────

export interface ApiError {
    error: true;
    message: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    nextCursor: string | null;
    total?: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = "super_admin" | "admin" | "user";

export interface ApiUser {
    id: string;
    email: string;
    role: UserRole;
    permissions?: string[];
    name?: string;
    fullName?: string;
    rut?: string;
    phone?: string | null;
    address?: string | null;
    department?: string | null;
    position?: string | null;
    startDate?: string | null;
}

// ─── Requests ────────────────────────────────────────────────────────────────

export type RequestType =
    | "PERMISO_ADMINISTRATIVO"
    | "FERIADO_LEGAL"
    | "COMPENSATORIO"
    | "VACACIONES"
    | "OTRO";

export type RequestStatus = "PENDING" | "VISADO" | "APPROVED" | "REJECTED";

export interface ApiRequest {
    id: string;
    userId: string;
    userName: string;
    type: RequestType;
    startDate: string;
    endDate: string;
    returnDate?: string;
    timeFormat?: "DIA_COMPLETO" | "MEDIO_DIA_AM" | "MEDIO_DIA_PM";
    reason?: string;
    status: RequestStatus;
    adminResponse?: string;
    createdAt: string;
    updatedAt?: string;
    visadoBy?: string;
    approvedBy?: string;
}

export interface ApiRequestsResponse {
    requests: ApiRequest[];
    nextCursor?: string | null;
}

// ─── Documents ───────────────────────────────────────────────────────────────

export interface ApiDocument {
    id: string;
    title: string;
    type: string;
    userId: string;
    userName?: string;
    url: string;
    size?: number;
    mimeType?: string;
    createdAt: string;
    uploadedBy: string;
    signedBy?: string[];
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface ApiAttendanceLog {
    id: string;
    userId: string;
    userName?: string;
    date: string;
    punchIn?: string;
    punchOut?: string;
    totalHours?: number;
    overtime?: number;
    status?: "PRESENTE" | "AUSENTE" | "TARDANZA";
}

// ─── ITAM ────────────────────────────────────────────────────────────────────

export interface ApiAsset {
    id: string;
    name: string;
    serialNumber?: string;
    type: string;
    status: "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "RETIRED";
    assignedTo?: string;
    assignedUserName?: string;
    assignedAt?: string;
    createdAt: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface ApiKPIs {
    totalUsers: number;
    activeUsers?: number;
    pendingRequests: number;
    averageAttendance?: number;
    documentsThisMonth?: number;
}

// ─── Medical Licenses ────────────────────────────────────────────────────────

export type LicenseStatus = "RECEPCIONADA" | "TRAMITADA";

export interface ApiMedicalLicense {
    id: string;
    userId: string;
    userName?: string;
    status: LicenseStatus;
    startDate: string | { _seconds: number };
    durationDays: number;
    createdAt: string;
    createdBy: string;
}

// ─── Karin (Denuncias) ───────────────────────────────────────────────────────

export type KarinStatus = "Abierto" | "En_Investigacion" | "Cerrado";

export interface ApiKarinReport {
    id: string;
    reporter_id: string | null;
    accused_name: string;
    description: string;
    incident_date: string;
    status: KarinStatus;
    created_at: string;
}
