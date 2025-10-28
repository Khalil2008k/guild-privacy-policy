import { io, Socket } from 'socket.io-client';
import { logger } from '@/utils/logger';

/**
 * Safe Socket Connection Service
 * Only connects with valid auth token, otherwise skips gracefully (no noise)
 * Fixes: Socket connection errors and authentication issues
 */

/**
 * Maybe connect socket only if valid auth token is available
 * Returns null if no token, preventing connection noise
 */
export async function maybeConnectSocket(authToken?: string): Promise<Socket | null> {
  try {
    // Get auth token if not provided
    if (!authToken) {
      try {
        const { auth } = await import('@/config/firebase');
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          logger.warn('[SocketService] No authenticated user; skipping socket connection');
          return null;
        }
        
        authToken = await currentUser.getIdToken();
      } catch (error) {
        logger.warn('[SocketService] Failed to get auth token; skipping socket connection');
        return null;
      }
    }

    // Validate token exists
    if (!authToken) {
      logger.warn('[SocketService] Socket auth token missing; skipping connect');
      return null;
    }

    // Get WebSocket URL from environment
    const wsUrl = process.env.EXPO_PUBLIC_WS_URL || process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '').replace('/api', '');
    
    if (!wsUrl) {
      logger.error('[SocketService] No WebSocket URL configured');
      return null;
    }

    logger.info(`[SocketService] 🚀 Connecting to socket server: ${wsUrl}`);

    // Create socket with auth token
    const socket = io(wsUrl, {
      transports: ["websocket"],
      auth: { token: authToken },
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
    });

    // Handle connection errors gracefully
    socket.on("connect_error", (error) => {
      logger.error(`[SocketService] Socket connect_error: ${error.message}`);
    });

    socket.on("connect", () => {
      logger.info(`[SocketService] ✅ Socket connected successfully`);
    });

    socket.on("disconnect", (reason) => {
      logger.info(`[SocketService] Socket disconnected: ${reason}`);
    });

    socket.on("error", (error) => {
      logger.error(`[SocketService] Socket error:`, error);
    });

    logger.info(`[SocketService] ✅ Socket connection initiated with authenticated token`);
    return socket;

  } catch (error: any) {
    logger.error(`[SocketService] ❌ Socket connection error:`, error);
    return null;
  }
}

/**
 * Safe socket connection that doesn't throw errors
 * Returns null if connection fails, logs warnings instead of errors
 */
export async function connectSocketSafely(): Promise<Socket | null> {
  try {
    const socket = await maybeConnectSocket();
    
    if (socket) {
      logger.info(`[SocketService] ✅ Socket connection successful`);
    } else {
      logger.info(`[SocketService] Socket connection skipped (no token/offline)`);
    }
    
    return socket;
    
  } catch (error: any) {
    logger.warn(`[SocketService] ⚠️ Socket connection failed (non-critical):`, error);
    return null;
  }
}

/**
 * Check if socket connection is supported
 */
export function isSocketConnectionSupported(): boolean {
  // Check if WebSocket URL is configured
  const wsUrl = process.env.EXPO_PUBLIC_WS_URL || process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '').replace('/api', '');
  
  if (!wsUrl) {
    logger.warn(`[SocketService] No WebSocket URL configured - socket connection unavailable`);
    return false;
  }
  
  return true;
}

/**
 * Disconnect socket safely
 */
export function disconnectSocketSafely(socket: Socket | null): void {
  if (socket) {
    try {
      socket.disconnect();
      logger.info(`[SocketService] ✅ Socket disconnected safely`);
    } catch (error) {
      logger.warn(`[SocketService] ⚠️ Error disconnecting socket:`, error);
    }
  }
}
