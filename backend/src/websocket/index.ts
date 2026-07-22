/**
 * WebSocket Index
 * Exports SocketManager and initialization functions
 */

export { SocketManager, initializeSocketManager, getSocketManager } from './socketManager';
export type { AuthenticatedSocket, ChatMessage, LocationUpdate, TaskUpdate } from './socketManager';