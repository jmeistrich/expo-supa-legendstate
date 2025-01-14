import { createClient } from '@supabase/supabase-js';
// import { Database } from './database.types'; // TODO
import { observable } from '@legendapp/state';
import {
  configureSyncedSupabase,
  syncedSupabase,
} from '@legendapp/state/sync-plugins/supabase';
import { v4 as uuidv4 } from 'uuid';
import { configureObservableSync } from '@legendapp/state/sync';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';

// Global configuration
configureObservableSync({
  // Use react-native-mmkv in React Native
  persist: {
    plugin: ObservablePersistMMKV,
  },
});

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// provide a function to generate ids locally
const generateId = () => uuidv4();
configureSyncedSupabase({
  generateId,
});
const uid = '';

export const todos$ = observable(
  syncedSupabase({
    supabase,
    collection: 'todos',
    // Optional:
    // Select only id and text fields
    select: (from) => from.select('id,text,done'),
    // Filter by the current user
    // filter: (select) => select.eq('user_id', uid),
    // Don't allow delete
    actions: ['read', 'create', 'update'],
    // Realtime filter by user_id
    realtime: {
      schema: 'public',
      // filter: `user_id=eq.${uid}` // TODO: add auth
    },
    // Persist data and pending changes locally
    persist: { name: 'todos', retrySync: true },
    // Sync only diffs
    changesSince: 'last-sync',
  })
);

export function addTodo(text: string) {
  const id = generateId();
  // Add keyed by id to the messages$ observable to trigger a create in Supabase
  todos$[id].set({
    id,
    text,
    created_at: null,
    updated_at: null,
  });
}
