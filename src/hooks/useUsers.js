/**
 * hooks/useUsers.js
 *
 * Hook que centraliza la lógica de gestión de usuarios:
 * - Cargar lista
 * - Eliminar (soft)
 * - Filtrar por búsqueda
 * - Estado de carga y errores
 *
 * Usado en UsersPage.jsx (admin).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { userService } from '../services/user.service';

export function useUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Cargar usuarios
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await userService.getUsers();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar usuarios');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Alias para mantener compatibilidad
    const fetchAllUsers = fetchUsers;

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Eliminar (soft) un usuario
    const deleteUser = useCallback(async (userId) => {
        try {
            await userService.deleteUser(userId);
            // Actualizar localmente (optimista)
            setUsers(prev => prev.filter(u => u._id !== userId));
            return { success: true };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.message || 'Error al eliminar usuario'
            };
        }
    }, []);

    // Actualizar un usuario (refetch para evitar stale state)
    const updateUser = useCallback(async (userId, name, email, role, password) => {
        try {
            const updated = await userService.updateUser(userId, name, email, password, role);
            setUsers(prev => prev.map(u => u._id === userId ? updated : u));
            return { success: true, data: updated };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.message || 'Error al actualizar usuario'
            };
        }
    }, []);

    // Filtrar por término de búsqueda
    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users;
        const term = searchTerm.toLowerCase();
        return users.filter(u =>
            (u.name?.toLowerCase().includes(term)) ||
            (u.email?.toLowerCase().includes(term)) ||
            (u.role?.toLowerCase().includes(term))
        );
    }, [users, searchTerm]);

    return {
        users,
        filteredUsers,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        fetchUsers,
        deleteUser,
        updateUser,
    };
}
