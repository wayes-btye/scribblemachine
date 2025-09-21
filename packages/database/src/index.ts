import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User, Job, Asset, Credits, CreditEvent } from '@coloringpage/types';

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      jobs: {
        Row: Job;
        Insert: Omit<Job, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Job, 'id'>>;
      };
      assets: {
        Row: Asset;
        Insert: Omit<Asset, 'id' | 'created_at'>;
        Update: Partial<Omit<Asset, 'id'>>;
      };
      credits: {
        Row: Credits;
        Insert: Credits;
        Update: Partial<Credits>;
      };
      credit_events: {
        Row: CreditEvent;
        Insert: Omit<CreditEvent, 'id' | 'created_at'>;
        Update: never;
      };
      rate_limits: {
        Row: {
          id: string;
          count: number;
          window_start: string;
        };
        Insert: {
          id: string;
          count: number;
          window_start: string;
        };
        Update: {
          count: number;
        };
      };
    };
  };
};

export function createSupabaseClient(
  url: string,
  key: string,
  options = {}
): SupabaseClient<Database> {
  return createClient<Database>(url, key, options);
}

export function createSupabaseAdminClient(
  url: string,
  serviceRoleKey: string
): SupabaseClient<Database> {
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export * from '@coloringpage/types';