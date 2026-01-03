/**
 * PulseTrade Supabase Configuration
 * Client setup for database and realtime operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  UserRow,
  BetRow,
  ChatMessageRow,
  UserSettingsRow,
  LeaderboardRow,
} from './types';

// ============================================
// Database Types
// ============================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: Omit<UserRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserRow, 'id'>>;
      };
      bets: {
        Row: BetRow;
        Insert: Omit<BetRow, 'id' | 'placed_at'> & {
          id?: string;
          placed_at?: string;
        };
        Update: Partial<Omit<BetRow, 'id' | 'user_id'>>;
      };
      chat_messages: {
        Row: ChatMessageRow;
        Insert: Omit<ChatMessageRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ChatMessageRow, 'id' | 'user_id'>>;
      };
      user_settings: {
        Row: UserSettingsRow;
        Insert: UserSettingsRow;
        Update: Partial<Omit<UserSettingsRow, 'user_id'>>;
      };
    };
    Views: {
      leaderboard: {
        Row: LeaderboardRow;
      };
    };
  };
}

// ============================================
// Environment Validation
// ============================================

function getSupabaseConfig(): { url: string; anonKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
        'Please add it to your .env.local file.'
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
        'Please add it to your .env.local file.'
    );
  }

  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

// ============================================
// Client Creation
// ============================================

let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Get the Supabase client instance (singleton pattern)
 * This is used for client-side operations
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, anonKey } = getSupabaseConfig();

  supabaseClient = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return supabaseClient;
}

/**
 * Create a new Supabase client for server-side operations
 * Use this in API routes and server components
 */
export function createServerSupabaseClient(): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseConfig();

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Create a Supabase admin client with service role key
 * Use this only for server-side admin operations
 * WARNING: This bypasses Row Level Security
 */
export function createAdminSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.');
  }

  if (!supabaseServiceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
        'This is required for admin operations.'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// ============================================
// Default Export
// ============================================

// Default client for easy importing
const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null;
export default supabase;

// ============================================
// Helper Functions
// ============================================

/**
 * Subscribe to realtime changes on a table
 */
export function subscribeToTable<T extends keyof Database['public']['Tables']>(
  table: T,
  callback: (
    payload: Database['public']['Tables'][T]['Row'],
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  ) => void
) {
  const client = getSupabaseClient();

  return client
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: table as string },
      (payload) => {
        callback(
          payload.new as Database['public']['Tables'][T]['Row'],
          payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
        );
      }
    )
    .subscribe();
}

/**
 * Subscribe to bet updates for a specific user
 */
export function subscribeToBetUpdates(
  userId: string,
  callback: (bet: BetRow, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
) {
  const client = getSupabaseClient();

  return client
    .channel(`bets:user_id=eq.${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bets',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(
          payload.new as BetRow,
          payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
        );
      }
    )
    .subscribe();
}

/**
 * Subscribe to chat messages
 */
export function subscribeToChatMessages(
  callback: (message: ChatMessageRow) => void
) {
  const client = getSupabaseClient();

  return client
    .channel('public:chat_messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      (payload) => {
        callback(payload.new as ChatMessageRow);
      }
    )
    .subscribe();
}
