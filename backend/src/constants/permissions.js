/**
 * Archivo estandarizado de permisos granulares del sistema SubeIA.
 * Las rutas del backend deben basarse en estos permisos.
 */

export const PERMISSIONS = {
  // ── RRHH ──
  VIEW_HR_PANEL: 'view_hr_panel', // Permite ingresar al dashboard de RRHH

  // ── Usuarios & Roles ──
  MANAGE_USERS: 'manage_users', // Permite crear, editar, borrar y asignar roles/permisos a empleados

  // ── Solicitudes ──
  APPROVE_REQUESTS: 'approve_requests', // Permite visar o aprobar solicitudes (actuar como jefatura)
  MANAGE_SHIFTS: 'manage_shifts', // Permite asignar o editar turnos

  // ── Documentos y Asistencia ──
  MANAGE_DOCUMENTS: 'manage_documents', // Permite subir documentos al perfil de empleados
  MANAGE_ATTENDANCE: 'manage_attendance', // Permite editar marcas de asistencia pasadas u horas extra
  MANAGE_MEDICAL_LICENSES: 'manage_medical_licenses', // Permite gestionar licencias

  // ── Denuncias (Karin) ──
  VIEW_KARIN_REPORTS: 'view_karin_reports', // Permite leer las denuncias de Ley Karin
  MANAGE_KARIN_REPORTS: 'manage_karin_reports', // Permite actualizar el estado de denuncias

  // ── Activos (ITAM) ──
  MANAGE_ITAM: 'manage_itam', // Permite asignar o retirar equipos a usuarios

  // ── Reportes ──
  VIEW_ANALYTICS: 'view_analytics', // Permite ver las métricas globales y KPIs

  // ── Admin Empresa ──
  MANAGE_COMPANY: 'manage_company' // Permite editar datos de la propia empresa (Nombre, logo, configuraciones)
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
