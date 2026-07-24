import { apiClient } from "../api/axios";

class ChatService {
  /**
   * Crea un nuevo chat en el backend.
   * @param {string} initialContext - Contexto inicial del chat (ej: "chat", "normativas").
   * @returns {Promise<object>} - Datos del chat creado.
   */
  async createChat(initialContext) {
    try {
      const response = await apiClient.post(`/chats`, {
        initialContext,
      });
      return response.data;
    } catch (error) {
      console.error("❌ Error al crear el chat en ChatService:", error);
      throw (
        error.response?.data ||
        new Error("Error desconocido al crear el chat.")
      );
    }
  }

  /**
   * Actualiza el contexto de un chat específico.
   * @param {string} chatId - ID del chat actual.
   * @param {string} newContext - Nombre del nuevo contexto seleccionado.
   * @returns {Promise<object>} - Datos del chat actualizado.
   */
  async updateContext(chatId, newContext) {
    try {
      const response = await apiClient.post(`/chats/${chatId}/context`, {
        newContext,
      });
      return response.data;
    } catch (error) {
      console.error("❌ Error al actualizar el contexto en ChatService:", error);
      throw (
        error.response?.data ||
        new Error("Error desconocido al actualizar el contexto.")
      );
    }
  }

  /**
   * Obtiene el historial de chats por nombre de contexto.
   *
   * IMPORTANTE: el backend (a partir de la paginación de F-075) devuelve
   *   { data: [...chats], pagination: { page, limit, total, pages, hasNext, hasPrev } }
   * Acá extraemos solo `data` para que el frontend siga trabajando con un array
   * plano (todos los call sites asumen array). Si en el futuro el frontend
   * quiere usar paginación visible, agregar un método nuevo que retorne el
   * response completo (ej: `getHistorialChatsByContextPaged`).
   *
   * @param {string} contextName - Nombre del contexto a buscar.
   * @returns {Promise<array>} - Historial de chats recuperados.
   */
  async getHistorialChatsByContext(contextName) {
    try {
      const response = await apiClient.get(`/chats/context/${contextName}`);
      // Unwrap de la paginación: retornar solo el array de chats
      return response.data?.data ?? response.data ?? [];
    } catch (error) {
      console.error("❌ Error al obtener historial de chats en ChatService:", error);
      throw (
        error.response?.data ||
        new Error("Error desconocido al obtener el historial de chats.")
      );
    }
  }

  /**
   * Elimina un chat por ID (Lógica robusta con manejo de errores detallado).
   * @param {string} chatId - ID del chat a eliminar.
   * @returns {Promise<object>} - Objeto de estado { success, message, data }
   */
  async deleteChat(chatId) {
    try {
      if (!chatId || typeof chatId !== 'string') {
        throw new Error('ID del chat es requerido y debe ser una cadena válida');
      }

      const response = await apiClient.delete(`/chats/${chatId}`);

      return {
        success: true,
        message: response.data.message || 'Chat eliminado exitosamente',
        data: response.data
      };
    } catch (error) {
      return this._handleError(error, 'Error al eliminar el chat', 'DELETE_CHAT_ERROR');
    }
  }

  /**
   * Actualiza el nombre/título de un chat.
   * @param {string} chatId - ID del chat a actualizar.
   * @param {string} newTitle - Nuevo título para el chat.
   * @returns {Promise<object>} - Objeto de estado { success, message, updatedChat }
   */
  async updateChatTitle(chatId, newTitle) {
    try {
      if (!chatId || typeof chatId !== 'string') {
        throw new Error('ID del chat es requerido y debe ser una cadena válida');
      }
      if (!newTitle || typeof newTitle !== 'string' || newTitle.trim().length === 0) {
        throw new Error('El nuevo título es requerido y debe ser una cadena no vacía');
      }

      const response = await apiClient.put(`/chats/${chatId}/title`, {
        newTitle: newTitle.trim()
      });

      return {
        success: true,
        message: 'Título actualizado exitosamente',
        updatedChat: response.data
      };
    } catch (error) {
      return this._handleError(error, 'Error al actualizar el título', 'UPDATE_TITLE_ERROR');
    }
  }

  /**
   * Método helper interno para procesar errores consistentes de Axios.
   * @private
   */
  _handleError(error, defaultMessage, errorCode) {
    if (error.response) {
      const { status, data } = error.response;
      return {
        success: false,
        message: data.message || defaultMessage,
        error: { status, code: errorCode, details: data.details || null }
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'Error de conexión. Verifica tu conexión a internet',
        error: { code: 'NETWORK_ERROR', details: 'Sin respuesta del servidor' }
      };
    } else {
      return {
        success: false,
        message: error.message || defaultMessage,
        error: { code: 'VALIDATION_ERROR', details: error.message }
      };
    }
  }
}

export const chatService = new ChatService();