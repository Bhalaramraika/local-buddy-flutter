/**
 * Socket Manager
 * Manages WebSocket connections for real-time features:
 * - Chat messaging
 * - Location sharing
 * - Task updates
 * - Notifications
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/prisma';
import { supabaseAdmin } from '../config/supabase';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: string;
  chatRooms: Set<string>;
  locationRooms: Set<string>;
  taskRooms: Set<string>;
}

// Supabase Realtime payload types
interface SupabasePayload<T = any> {
  new: T | null;
  old: T | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
}

interface SupabaseMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: string;
  metadata: any;
  created_at: string;
}

interface SupabaseTask {
  id: string;
  [key: string]: any;
}

interface SupabaseLocationShare {
  task_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  created_at: string;
}

interface UserSocketMap {
  [userId: string]: Set<string>; // userId -> Set of socket IDs
}

interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'LOCATION' | 'SYSTEM';
  metadata?: any;
  createdAt: Date;
}

interface LocationUpdate {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

interface TaskUpdate {
  taskId: string;
  type: 'STATUS_CHANGE' | 'ASSIGNMENT' | 'LOCATION_UPDATE' | 'MESSAGE' | 'CANCELLATION';
  data: any;
  updatedBy: string;
}

export class SocketManager {
  private io: SocketIOServer;
  private userSockets: UserSocketMap = {};
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId
  private chatRooms: Map<string, Set<string>> = new Map(); // chatId -> Set of userIds
  private locationRooms: Map<string, Set<string>> = new Map(); // taskId -> Set of userIds
  private taskRooms: Map<string, Set<string>> = new Map(); // taskId -> Set of userIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupSupabaseRealtime();
    
    logger.info('[SocketManager] WebSocket server initialized');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) {
          return next(new Error('Invalid token'));
        }

        // Verify user exists and is active
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, role: true, isActive: true },
        });

        if (!user || !user.isActive) {
          return next(new Error('User not found or inactive'));
        }

        socket.userId = user.id;
        socket.userRole = user.role;
        socket.chatRooms = new Set();
        socket.locationRooms = new Set();
        socket.taskRooms = new Set();

        next();
      } catch (error) {
        logger.error('[SocketManager] Auth error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new connection
   */
  private async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    const { userId } = socket;
    
    // Track user sockets
    if (!this.userSockets[userId]) {
      this.userSockets[userId] = new Set();
    }
    this.userSockets[userId].add(socket.id);
    this.socketUsers.set(socket.id, userId);

    // Update user online status
    await this.setUserOnlineStatus(userId, true);

    logger.info(`[SocketManager] User connected: ${userId} (${socket.id})`);

    // Join user's personal room for notifications
    socket.join(`user:${userId}`);

    // ============================================================
    // Chat Events
    // ============================================================

    // Join chat room
    socket.on('chat:join', async (data: { chatId: string }) => {
      await this.handleChatJoin(socket, data.chatId);
    });

    // Leave chat room
    socket.on('chat:leave', (data: { chatId: string }) => {
      this.handleChatLeave(socket, data.chatId);
    });

    // Send message
    socket.on('chat:message', async (data: {
      chatId: string;
      content: string;
      type: ChatMessage['type'];
      metadata?: any;
      replyToId?: string;
    }) => {
      await this.handleChatMessage(socket, data);
    });

    // Typing indicator
    socket.on('chat:typing', (data: { chatId: string; isTyping: boolean }) => {
      this.handleTypingIndicator(socket, data.chatId, data.isTyping);
    });

    // Mark messages as read
    socket.on('chat:read', async (data: { chatId: string; messageId: string }) => {
      await this.handleMarkAsRead(socket, data.chatId, data.messageId);
    });

    // Delete message
    socket.on('chat:delete', async (data: { chatId: string; messageId: string }) => {
      await this.handleDeleteMessage(socket, data.chatId, data.messageId);
    });

    // ============================================================
    // Location Sharing Events
    // ============================================================

    // Start location sharing for a task
    socket.on('location:start', async (data: { taskId: string }) => {
      await this.handleLocationStart(socket, data.taskId);
    });

    // Stop location sharing
    socket.on('location:stop', (data: { taskId: string }) => {
      this.handleLocationStop(socket, data.taskId);
    });

    // Location update
    socket.on('location:update', (data: LocationUpdate) => {
      this.handleLocationUpdate(socket, data);
    });

    // Request location from task participants
    socket.on('location:request', (data: { taskId: string; targetUserId?: string }) => {
      this.handleLocationRequest(socket, data.taskId, data.targetUserId);
    });

    // ============================================================
    // Task Events
    // ============================================================

    // Join task room
    socket.on('task:join', async (data: { taskId: string }) => {
      await this.handleTaskJoin(socket, data.taskId);
    });

    // Leave task room
    socket.on('task:leave', (data: { taskId: string }) => {
      this.handleTaskLeave(socket, data.taskId);
    });

    // Task status update
    socket.on('task:status', async (data: { taskId: string; status: string; note?: string }) => {
      await this.handleTaskStatusUpdate(socket, data.taskId, data.status, data.note);
    });

    // Task assignment
    socket.on('task:assign', async (data: { taskId: string; assigneeId: string }) => {
      await this.handleTaskAssignment(socket, data.taskId, data.assigneeId);
    });

    // ============================================================
    // Notification Events
    // ============================================================

    // Subscribe to notifications
    socket.on('notifications:subscribe', () => {
      socket.join(`notifications:${userId}`);
    });

    // Unsubscribe from notifications
    socket.on('notifications:unsubscribe', () => {
      socket.leave(`notifications:${userId}`);
    });

    // ============================================================
    // Disconnect Handling
    // ============================================================

    socket.on('disconnect', async (reason) => {
      await this.handleDisconnect(socket, reason);
    });

    socket.on('error', (error) => {
      logger.error(`[SocketManager] Socket error for ${userId}:`, error);
    });
  }

  // ============================================================
  // Chat Handlers
  // ============================================================

  private async handleChatJoin(socket: AuthenticatedSocket, chatId: string): Promise<void> {
    const { userId } = socket;

    // Verify user is participant of this chat
    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!participant) {
      socket.emit('chat:error', { chatId, error: 'Not a participant of this chat' });
      return;
    }

    // Join socket room
    socket.join(`chat:${chatId}`);
    socket.chatRooms!.add(chatId);

    // Track chat room participants
    if (!this.chatRooms.has(chatId)) {
      this.chatRooms.set(chatId, new Set());
    }
    this.chatRooms.get(chatId)!.add(userId);

    // Update participant's last read
    await prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { lastReadAt: new Date() },
    });

    // Notify others in chat
    socket.to(`chat:${chatId}`).emit('chat:user-joined', {
      chatId,
      userId,
      userName: (await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name,
    });

    // Acknowledge join
    socket.emit('chat:joined', { chatId });
  }

  private handleChatLeave(socket: AuthenticatedSocket, chatId: string): void {
    const { userId } = socket;

    socket.leave(`chat:${chatId}`);
    socket.chatRooms!.delete(chatId);

    const room = this.chatRooms.get(chatId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.chatRooms.delete(chatId);
      }
    }

    socket.to(`chat:${chatId}`).emit('chat:user-left', { chatId, userId });
    socket.emit('chat:left', { chatId });
  }

  private async handleChatMessage(socket: AuthenticatedSocket, data: {
    chatId: string;
    content: string;
    type: ChatMessage['type'];
    metadata?: any;
    replyToId?: string;
  }): Promise<void> {
    const { userId } = socket;
    const { chatId, content, type, metadata, replyToId } = data;

    // Verify participant
    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!participant) {
      socket.emit('chat:error', { chatId, error: 'Not a participant' });
      return;
    }

    // Create message in database
    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content,
        type,
        metadata,
        replyToId,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        replyTo: { select: { id: true, content: true, senderId: true } },
      },
    });

    // Update chat last message
    await prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date(), lastMessageId: message.id },
    });

    // Increment unread count for other participants
    await prisma.chatParticipant.updateMany({
      where: { chatId, userId: { not: userId } },
      data: { unreadCount: { increment: 1 } },
    });

    // Broadcast to chat room
    const messageData = {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      sender: message.sender,
      content: message.content,
      type: message.type,
      metadata: message.metadata,
      replyTo: message.replyTo,
      createdAt: message.createdAt,
    };

    this.io.to(`chat:${chatId}`).emit('chat:message', messageData);

    // Send push notifications to offline participants
    await this.sendChatPushNotifications(chatId, userId, messageData);
  }

  private handleTypingIndicator(socket: AuthenticatedSocket, chatId: string, isTyping: boolean): void {
    const { userId } = socket;
    
    // Broadcast to others in chat
    socket.to(`chat:${chatId}`).emit('chat:typing', {
      chatId,
      userId,
      isTyping,
      userName: socket.userId, // Would need to fetch name
    });
  }

  private async handleMarkAsRead(socket: AuthenticatedSocket, chatId: string, messageId: string): Promise<void> {
    const { userId } = socket;

    // Update participant's last read
    await prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { lastReadAt: new Date(), unreadCount: 0 },
    });

    // Notify others
    socket.to(`chat:${chatId}`).emit('chat:read', { chatId, userId, messageId });
  }

  private async handleDeleteMessage(socket: AuthenticatedSocket, chatId: string, messageId: string): Promise<void> {
    const { userId } = socket;

    // Verify ownership
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.senderId !== userId) {
      socket.emit('chat:error', { error: 'Not authorized to delete this message' });
      return;
    }

    // Soft delete
    await prisma.message.update({
      where: { id: messageId },
      data: { deleted: true, deletedAt: new Date() },
    });

    // Notify chat room
    this.io.to(`chat:${chatId}`).emit('chat:message-deleted', { chatId, messageId });
  }

  // ============================================================
  // Location Handlers
  // ============================================================

  private async handleLocationStart(socket: AuthenticatedSocket, taskId: string): Promise<void> {
    const { userId } = socket;

    // Verify user is part of this task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, poster: true },
    });

    if (!task || (task.assigneeId !== userId && task.posterId !== userId)) {
      socket.emit('location:error', { taskId, error: 'Not authorized for this task' });
      return;
    }

    // Join location room
    socket.join(`location:${taskId}`);
    socket.locationRooms!.add(taskId);

    if (!this.locationRooms.has(taskId)) {
      this.locationRooms.set(taskId, new Set());
    }
    this.locationRooms.get(taskId)!.add(userId);

    // Notify others in task
    socket.to(`location:${taskId}`).emit('location:user-joined', {
      taskId,
      userId,
      userName: (await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name,
    });

    // Send current locations of other participants
    const otherParticipants = this.locationRooms.get(taskId)!.filter(id => id !== userId);
    for (const participantId of otherParticipants) {
      // Would fetch last known location from cache/DB
    }

    socket.emit('location:started', { taskId });
  }

  private handleLocationStop(socket: AuthenticatedSocket, taskId: string): void {
    const { userId } = socket;

    socket.leave(`location:${taskId}`);
    socket.locationRooms!.delete(taskId);

    const room = this.locationRooms.get(taskId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.locationRooms.delete(taskId);
      }
    }

    socket.to(`location:${taskId}`).emit('location:user-left', { taskId, userId });
    socket.emit('location:stopped', { taskId });
  }

  private handleLocationUpdate(socket: AuthenticatedSocket, data: LocationUpdate): void {
    const { userId } = socket;
    const { taskId, ...locationData } = data;

    // Verify user is in location room
    if (!socket.locationRooms!.has(taskId)) {
      return;
    }

    // Broadcast to others in task
    socket.to(`location:${taskId}`).emit('location:update', {
      taskId,
      userId,
      ...locationData,
    });

    // Optionally persist to database/cache
    this.cacheLocation(taskId, userId, locationData);
  }

  private handleLocationRequest(socket: AuthenticatedSocket, taskId: string, targetUserId?: string): void {
    const { userId } = socket;

    if (targetUserId) {
      // Request specific user's location
      this.io.to(`user:${targetUserId}`).emit('location:requested', {
        taskId,
        requestedBy: userId,
      });
    } else {
      // Request all participants' locations
      socket.to(`location:${taskId}`).emit('location:requested', {
        taskId,
        requestedBy: userId,
      });
    }
  }

  // ============================================================
  // Task Handlers
  // ============================================================

  private async handleTaskJoin(socket: AuthenticatedSocket, taskId: string): Promise<void> {
    const { userId } = socket;

    // Verify access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, poster: true },
    });

    if (!task || (task.assigneeId !== userId && task.posterId !== userId)) {
      socket.emit('task:error', { taskId, error: 'Not authorized' });
      return;
    }

    socket.join(`task:${taskId}`);
    socket.taskRooms!.add(taskId);

    if (!this.taskRooms.has(taskId)) {
      this.taskRooms.set(taskId, new Set());
    }
    this.taskRooms.get(taskId)!.add(userId);

    socket.emit('task:joined', { taskId });
  }

  private handleTaskLeave(socket: AuthenticatedSocket, taskId: string): void {
    const { userId } = socket;

    socket.leave(`task:${taskId}`);
    socket.taskRooms!.delete(taskId);

    const room = this.taskRooms.get(taskId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.taskRooms.delete(taskId);
      }
    }

    socket.emit('task:left', { taskId });
  }

  private async handleTaskStatusUpdate(socket: AuthenticatedSocket, taskId: string, status: string, note?: string): Promise<void> {
    const { userId } = socket;

    // Verify authorization
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || (task.assigneeId !== userId && task.posterId !== userId)) {
      socket.emit('task:error', { taskId, error: 'Not authorized' });
      return;
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: status as any, statusNote: note },
      include: { assignee: true, poster: true },
    });

    // Broadcast to task room
    this.io.to(`task:${taskId}`).emit('task:status-changed', {
      taskId,
      status,
      note,
      updatedBy: userId,
      task: updatedTask,
    });

    // Send notifications
    await this.sendTaskNotifications(taskId, 'STATUS_CHANGE', { status, note }, userId);
  }

  private async handleTaskAssignment(socket: AuthenticatedSocket, taskId: string, assigneeId: string): Promise<void> {
    const { userId } = socket;

    // Verify poster
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.posterId !== userId) {
      socket.emit('task:error', { taskId, error: 'Only poster can assign' });
      return;
    }

    // Update assignment
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId, status: 'ASSIGNED' },
      include: { assignee: true, poster: true },
    });

    // Broadcast
    this.io.to(`task:${taskId}`).emit('task:assigned', {
      taskId,
      assigneeId,
      task: updatedTask,
    });

    // Notify assignee
    await this.sendTaskNotifications(taskId, 'ASSIGNMENT', { assigneeId }, userId);
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private async setUserOnlineStatus(userId: string, online: boolean): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        isOnline: online,
        lastSeenAt: online ? null : new Date(),
      },
    });

    // Broadcast to friends/contacts
    this.io.emit('user:status', { userId, online });
  }

  private async handleDisconnect(socket: AuthenticatedSocket, reason: string): Promise<void> {
    const { userId } = socket;

    // Remove from user sockets
    const userSocketSet = this.userSockets[userId];
    if (userSocketSet) {
      userSocketSet.delete(socket.id);
      if (userSocketSet.size === 0) {
        delete this.userSockets[userId];
        this.socketUsers.delete(socket.id);
        
        // Set offline after a grace period (in case of reconnection)
        setTimeout(async () => {
          if (!this.userSockets[userId]) {
            await this.setUserOnlineStatus(userId, false);
          }
        }, 30000);
      }
    }

    // Leave all rooms
    for (const chatId of socket.chatRooms!) {
      this.handleChatLeave(socket, chatId);
    }
    for (const taskId of socket.locationRooms!) {
      this.handleLocationStop(socket, taskId);
    }
    for (const taskId of socket.taskRooms!) {
      this.handleTaskLeave(socket, taskId);
    }

    logger.info(`[SocketManager] User disconnected: ${userId} (${socket.id}) - ${reason}`);
  }

  private async sendChatPushNotifications(chatId: string, senderId: string, message: any): Promise<void> {
    // Get offline participants
    const participants = await prisma.chatParticipant.findMany({
      where: { chatId, userId: { not: senderId } },
      include: { user: { select: { id: true, fcmToken: true, preferences: true } } },
    });

    for (const participant of participants) {
      const prefs = participant.user.preferences as any || {};
      if (prefs.notifications?.chat === false) continue;

      // Check if user is online in this chat
      const onlineInChat = this.chatRooms.get(chatId)?.has(participant.userId);
      if (onlineInChat) continue; // Don't push if online

      if (participant.user.fcmToken) {
        // Send push notification
        // await pushNotificationService.sendToToken(...)
      }
    }
  }

  private async sendTaskNotifications(taskId: string, type: string, data: any, actorId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, poster: true },
    });

    if (!task) return;

    const recipients = [task.posterId];
    if (task.assigneeId) recipients.push(task.assigneeId);

    for (const recipientId of recipients) {
      if (recipientId === actorId) continue;

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: recipientId,
          title: this.getTaskNotificationTitle(type),
          body: this.getTaskNotificationBody(type, data),
          data: { taskId, type, ...data },
          type: `TASK_${type}`,
        },
      });
    }
  }

  private getTaskNotificationTitle(type: string): string {
    switch (type) {
      case 'STATUS_CHANGE': return 'Task Status Updated';
      case 'ASSIGNMENT': return 'New Task Assigned';
      case 'CANCELLATION': return 'Task Cancelled';
      default: return 'Task Update';
    }
  }

  private getTaskNotificationBody(type: string, data: any): string {
    switch (type) {
      case 'STATUS_CHANGE': return `Task status changed to ${data.status}`;
      case 'ASSIGNMENT': return 'You have been assigned a new task';
      case 'CANCELLATION': return 'A task has been cancelled';
      default: return 'Task has been updated';
    }
  }

  private cacheLocation(taskId: string, userId: string, data: any): void {
    // Store in Redis or in-memory cache with TTL
    // Implementation depends on cache setup
  }

  // ============================================================
  // Supabase Realtime Integration
  // ============================================================

  private setupSupabaseRealtime(): void {
    // Listen to Supabase Realtime for database changes
    // This syncs with WebSocket clients
    
    // Chat messages
    supabaseAdmin
      .channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: SupabasePayload<SupabaseMessage>) => {
        this.handleSupabaseMessageInsert(payload.new);
      })
      .subscribe();

    // Task updates
    supabaseAdmin
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload: SupabasePayload<SupabaseTask>) => {
        this.handleSupabaseTaskChange(payload);
      })
      .subscribe();

    // Location updates
    supabaseAdmin
      .channel('locations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'location_shares' }, (payload: SupabasePayload<SupabaseLocationShare>) => {
        this.handleSupabaseLocationInsert(payload.new);
      })
      .subscribe();

    logger.info('[SocketManager] Supabase Realtime subscriptions established');
  }

  private handleSupabaseMessageInsert(message: SupabaseMessage | null): void {
    if (!message) return;
    // Broadcast to WebSocket clients in the chat room
    this.io.to(`chat:${message.chat_id}`).emit('chat:message', {
      id: message.id,
      chatId: message.chat_id,
      senderId: message.sender_id,
      content: message.content,
      type: message.type,
      metadata: message.metadata,
      createdAt: message.created_at,
    });
  }

  private handleSupabaseTaskChange(payload: SupabasePayload<SupabaseTask>): void {
    const task = payload.new || payload.old;
    if (!task) return;

    this.io.to(`task:${task.id}`).emit('task:updated', {
      taskId: task.id,
      event: payload.eventType,
      task,
    });
  }

  private handleSupabaseLocationInsert(location: SupabaseLocationShare | null): void {
    if (!location) return;
    this.io.to(`location:${location.task_id}`).emit('location:update', {
      taskId: location.task_id,
      userId: location.user_id,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: location.created_at,
    });
  }

  // ============================================================
  // Public Methods for External Use
  // ============================================================

  /**
   * Send notification to specific user
   */
  public sendNotification(userId: string, notification: Record<string, any>): void {
    this.io.to(`user:${userId}`).emit('notification', notification);
    this.io.to(`notifications:${userId}`).emit('notification', notification);
  }

  /**
   * Send notification to multiple users
   */
  public sendNotificationToUsers(userIds: string[], notification: Record<string, any>): void {
    userIds.forEach(userId => this.sendNotification(userId, notification));
  }

  /**
   * Broadcast to all connected users
   */
  public broadcast(event: string, data: Record<string, any>): void {
    this.io.emit(event, data);
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return Object.keys(this.userSockets).length;
  }

  /**
   * Check if user is online
   */
  public isUserOnline(userId: string): boolean {
    return !!this.userSockets[userId]?.size;
  }

  /**
   * Get user's socket IDs
   */
  public getUserSockets(userId: string): string[] {
    return Array.from(this.userSockets[userId] || []);
  }

  /**
   * Force disconnect user (admin action)
   */
  public async forceDisconnectUser(userId: string): Promise<void> {
    const sockets = this.getUserSockets(userId);
    for (const socketId of sockets) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
    }
  }

  /**
   * Get Socket.IO server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Singleton instance
let socketManagerInstance: SocketManager | null = null;

export function initializeSocketManager(httpServer: HTTPServer): SocketManager {
  if (!socketManagerInstance) {
    socketManagerInstance = new SocketManager(httpServer);
  }
  return socketManagerInstance;
}

export function getSocketManager(): SocketManager | null {
  return socketManagerInstance;
}