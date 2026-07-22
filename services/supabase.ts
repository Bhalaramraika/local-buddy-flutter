/**
 * Supabase Configuration
 * Based on Architecture.md - Supabase for real-time chat (messages) and live location tracking
 * Real-time subscriptions for messages and live_locations table
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// Supabase config from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Realtime channel management
const channels: Map<string, RealtimeChannel> = new Map();

export const subscribeToChannel = (
  channelName: string,
  config: {
    event?: string;
    schema?: string;
    table?: string;
    filter?: string;
    callback: (payload: any) => void;
  }
): RealtimeChannel => {
  const key = `${channelName}:${config.table || ''}:${config.filter || ''}`;
  
  if (channels.has(key)) {
    return channels.get(key)!;
  }
  
  let channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: false },
      presence: { key: '' },
    },
  });
  
  if (config.table) {
    channel = channel.on(
      'postgres_changes',
      {
        event: config.event || '*',
        schema: config.schema || 'public',
        table: config.table,
        filter: config.filter,
      },
      config.callback
    );
  }
  
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`[Supabase] Subscribed to ${key}`);
    } else if (status === 'CHANNEL_ERROR') {
      console.error(`[Supabase] Channel error for ${key}`);
    } else if (status === 'TIMED_OUT') {
      console.error(`[Supabase] Channel timeout for ${key}`);
    } else if (status === 'CLOSED') {
      console.log(`[Supabase] Channel closed for ${key}`);
      channels.delete(key);
    }
  });
  
  channels.set(key, channel);
  return channel;
};

export const unsubscribeFromChannel = (channelName: string, table?: string, filter?: string): void => {
  const key = `${channelName}:${table || ''}:${filter || ''}`;
  const channel = channels.get(key);
  
  if (channel) {
    supabase.removeChannel(channel);
    channels.delete(key);
    console.log(`[Supabase] Unsubscribed from ${key}`);
  }
};

export const unsubscribeAllChannels = (): void => {
  channels.forEach((channel) => {
    supabase.removeChannel(channel);
  });
  channels.clear();
  console.log('[Supabase] All channels unsubscribed');
};

// Helper functions for common subscriptions
export const subscribeToMessages = (
  chatId: string,
  callback: (payload: any) => void
): RealtimeChannel => {
  return subscribeToChannel(`chat:${chatId}`, {
    table: 'messages',
    filter: `chat_id=eq.${chatId}`,
    callback,
  });
};

export const subscribeToLiveLocation = (
  taskId: string,
  callback: (payload: any) => void
): RealtimeChannel => {
  return subscribeToChannel(`location:${taskId}`, {
    table: 'live_locations',
    filter: `task_id=eq.${taskId}`,
    callback,
  });
};

export const subscribeToTaskUpdates = (
  taskId: string,
  callback: (payload: any) => void
): RealtimeChannel => {
  return subscribeToChannel(`task:${taskId}`, {
    table: 'tasks',
    filter: `id=eq.${taskId}`,
    callback,
  });
};

export const subscribeToWalletTransactions = (
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel => {
  return subscribeToChannel(`wallet:${userId}`, {
    table: 'wallet_transactions',
    filter: `user_id=eq.${userId}`,
    callback,
  });
};

export default supabase;