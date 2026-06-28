import { apiClient } from "./axios";

class UserService {
  /**
   * Obtiene el listado de todos los usuarios.
   * @returns {Promise<Array>} - Array de usuarios.
   */
  async getUsers() {
    try {
      const response = await apiClient.get(`/admin/users`);
      return response.data;
    } catch (error) {
      console.error("❌ Error al obtener usuarios:", error);
      throw (
        error.response?.data ||
        new Error("Error desconocido al obtener usuarios.")
      );
    }
  }

  /**
   * Crea un nuevo usuario.
   * @param {string} name - Nombre del usuario.
   * @param {string} email - Email del usuario.
   * @param {string} password - Contraseña del usuario.
   * @param {string} role - Rol del usuario (admin o user).
   * @returns {Promise<object>} - Usuario creado.
   */
  async createUser(name, email, password, role = "user") {
    try {
      const response = await apiClient.post(`/admin/users`, {
        name,
        email,
        password,
        role,
      });

      return response.data;
    } catch (error) {
      console.error("❌ Error al crear usuario:", error);
      throw (
        error.response?.data ||
        new Error("Error desconocido al crear usuario.")
      );
    }
  }

  /**
   * Actualiza un usuario existente.
   * @param {string} userId - ID del usuario a actualizar.
   * @param {string} name - Nuevo nombre del usuario.
   * @param {string} email - Nuevo email del usuario.
   * @param {string} password - Nueva contraseña del usuario (opcional).
   * @param {string} role - Nuevo rol del usuario (admin o user).
   * @returns {Promise<object>} - Usuario actualizado.
   */
  async updateUser(userId, name, email, password, role) {
    try {
      const payload = {
        name,
        email,
        role,
      };

      // Solo incluir password si se proporciona
      if (password && password.trim() !== "") {
        payload.password = password;
      }

      const response = await apiClient.put(`/admin/users/${userId}`, payload);

      return response.data;
    } catch (error) {
      console.error("❌ Error al actualizar usuario:", error);
      throw (
        error.response?.data ||
        new Error("Error desconocido al actualizar usuario.")
      );
    }
  }

  /**
   * Elimina un usuario.
   * @param {string} userId - ID del usuario a eliminar.
   * @returns {Promise<object>} - Respuesta del servidor.
   */
  async deleteUser(userId) {
    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);

      return response.data;
    } catch (error) {
      console.error("❌ Error al eliminar usuario:", error);
      throw (
        error.response?.data ||
        new Error("Error desconocido al eliminar usuario.")
      );
    }
  }
}

export const userService = new UserService();