import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';
import api from '../config/api';

export interface Event {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number | null;
  creator_id: number;
  created_at: string;
  updated_at: string;
}

interface EventsState {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  createEvent: (event: Partial<Event>) => Promise<Event>;
  joinEvent: (eventId: number) => Promise<void>;
  leaveEvent: (eventId: number) => Promise<void>;
  syncPendingActions: () => Promise<void>;
}

const PENDING_ACTIONS_KEY = 'pending_event_actions';

interface PendingAction {
  type: 'join' | 'leave';
  eventId: number;
  timestamp: number;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      // Try to load from cache first
      const cachedEvents = await SecureStore.getItemAsync('events_cache');
      if (cachedEvents) {
        set({ events: JSON.parse(cachedEvents) });
      }

      // Check network status
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        set({ isLoading: false });
        return;
      }

      // Fetch from API
      const response = await api.get('/events/');
      const events = response.data;
      
      // Update cache
      await SecureStore.setItemAsync('events_cache', JSON.stringify(events));
      
      set({ events, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch events',
        isLoading: false 
      });
    }
  },

  createEvent: async (eventData: Partial<Event>) => {
    try {
      console.log('Sending event creation request:', eventData);
      const response = await api.post('/events/', eventData);
      const newEvent = response.data;
      console.log('Event creation response:', newEvent);
      
      set((state) => ({
        events: [newEvent, ...state.events],
      }));
      
      // Update cache
      await SecureStore.setItemAsync('events_cache', JSON.stringify(get().events));
      
      return newEvent;
    } catch (error: any) {
      console.error('Error in createEvent store:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  joinEvent: async (eventId: number) => {
    const networkState = await Network.getNetworkStateAsync();
    
    if (!networkState.isConnected) {
      // Queue action for later
      const pendingActions = await SecureStore.getItemAsync(PENDING_ACTIONS_KEY);
      const actions: PendingAction[] = pendingActions 
        ? JSON.parse(pendingActions) 
        : [];
      
      actions.push({
        type: 'join',
        eventId,
        timestamp: Date.now(),
      });
      
      await SecureStore.setItemAsync(PENDING_ACTIONS_KEY, JSON.stringify(actions));
      return;
    }

    try {
      await api.post(`/events/${eventId}/join`);
      await get().fetchEvents();
    } catch (error: any) {
      throw error;
    }
  },

  leaveEvent: async (eventId: number) => {
    const networkState = await Network.getNetworkStateAsync();
    
    if (!networkState.isConnected) {
      // Queue action for later
      const pendingActions = await SecureStore.getItemAsync(PENDING_ACTIONS_KEY);
      const actions: PendingAction[] = pendingActions 
        ? JSON.parse(pendingActions) 
        : [];
      
      actions.push({
        type: 'leave',
        eventId,
        timestamp: Date.now(),
      });
      
      await SecureStore.setItemAsync(PENDING_ACTIONS_KEY, JSON.stringify(actions));
      return;
    }

    try {
      await api.post(`/events/${eventId}/leave`);
      await get().fetchEvents();
    } catch (error: any) {
      throw error;
    }
  },

  syncPendingActions: async () => {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected) {
      return;
    }

    try {
      const pendingActionsStr = await SecureStore.getItemAsync(PENDING_ACTIONS_KEY);
      if (!pendingActionsStr) {
        return;
      }

      const actions: PendingAction[] = JSON.parse(pendingActionsStr);
      const failedActions: PendingAction[] = [];

      for (const action of actions) {
        try {
          if (action.type === 'join') {
            await api.post(`/events/${action.eventId}/join`);
          } else {
            await api.post(`/events/${action.eventId}/leave`);
          }
        } catch (error) {
          failedActions.push(action);
        }
      }

      if (failedActions.length > 0) {
        await SecureStore.setItemAsync(PENDING_ACTIONS_KEY, JSON.stringify(failedActions));
      } else {
        await SecureStore.deleteItemAsync(PENDING_ACTIONS_KEY);
      }

      // Refresh events after sync
      await get().fetchEvents();
    } catch (error) {
      console.error('Error syncing pending actions:', error);
    }
  },
}));
