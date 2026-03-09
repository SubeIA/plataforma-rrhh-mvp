/**
 * Roles estandarizados del sistema.
 * TODOS los chequeos de roles deben usar estas constantes.
 * Los roles se almacenan en minúscula en Firestore.
 */
export const ROLES = {
    ADMIN: 'admin',
    HR: 'hr',
    JEFATURA: 'jefatura',
    USER: 'user',
};

/** Lista de roles privilegiados (acceso HR) */
export const PRIVILEGED_ROLES = [ROLES.ADMIN, ROLES.HR];

/** Lista de roles con acceso de gestión (aprobaciones, ITAM, etc.) */
export const MANAGEMENT_ROLES = [ROLES.ADMIN, ROLES.JEFATURA];

/** Lista de todos los roles válidos */
export const ALL_ROLES = Object.values(ROLES);
