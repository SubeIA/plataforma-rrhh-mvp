/**
 * Roles estructurales base del sistema.
 * Solo definen la jerarquía técnica. Los accesos deben verificarse con permisos (permissions.js).
 * Los roles se almacenan en minúscula en Firestore.
 */
export const ROLES = {
    SUPER_ADMIN: 'super_admin', // Dueño del sistema (SubeIA): puede crear empresas y el primer admin. Acceso total.
    ADMIN: 'admin',             // Admin de empresa: gestiona su empresa completa (si tiene los permisos asigandos)
    USER: 'user',               // Usuario normal
};

/** 
 * Legacy lists: Ya no se deberían usar para verificar vistas/botones (usar permisos granulares).
 * Mantenidas temporalmente en caso de que alguna regla las necesite antes de ser refactorizada.
 */
export const PRIVILEGED_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
export const MANAGEMENT_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

/** Lista de todos los roles válidos */
export const ALL_ROLES = Object.values(ROLES);
