import { useAuth } from '@/context/AuthContext';
import { Permission } from '@/constants/permissions';

export const usePermissions = () => {
    // FE-05 FIX: Expose loading so consumers can avoid rendering restricted content
    // before Firebase Auth has resolved and the real role/permissions are known.
    const { role, permissions, loading } = useAuth();

    /**
     * Revisa si el usuario activo tiene un permiso en específico.
     * El 'super_admin' y 'admin' son roles estructurales que ignoran los permisos granulares.
     * @param permissionName El ID del permiso a consultar
     * @returns booleano verdadero si tiene acceso
     */
    const hasPermission = (permissionName: Permission): boolean => {
        if (role === 'super_admin' || role === 'admin') return true;
        
        // Verifica si el arreglo del usuario cuenta con la flag
        return permissions.includes(permissionName);
    };

    /**
     * Revisa si el usuario activo tiene AL MENOS UNO de los permisos solicitados.
     * @param permissionNames Arreglo de permisos a consultar
     */
    const hasAnyPermission = (permissionNames: Permission[]): boolean => {
        if (role === 'super_admin' || role === 'admin') return true;
        return permissionNames.some((p) => permissions.includes(p));
    };

    /**
     * Revisa si el usuario activo tiene TODOS los permisos solicitados de manera simultanea.
     * @param permissionNames Arreglo de permisos a consultar
     */
    const hasAllPermissions = (permissionNames: Permission[]): boolean => {
        if (role === 'super_admin' || role === 'admin') return true;
        return permissionNames.every((p) => permissions.includes(p));
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        loading  // FE-05: expose for consumers to gate content on auth resolution
    };
};
