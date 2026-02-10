import { create } from 'zustand';

export interface ChatMessage {
  id: number;
  content: string;
  sender_id: number;
  event_id: number;
  created_at: string;
}

interface ChatState {
  messages: Record<number, ChatMessage[]>; // eventId -> messages
  addMessage: (eventId: number, message: ChatMessage) => void;
  setMessages: (eventId: number, messages: ChatMessage[]) => void;
  clearMessages: (eventId: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: {},

  addMessage: (eventId: number, message: ChatMessage) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [eventId]: [...(state.messages[eventId] || []), message],
      },
    }));
  },

  setMessages: (eventId: number, messages: ChatMessage[]) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [eventId]: messages,
      },
    }));
  },

  clearMessages: (eventId: number) => {
    set((state) => {
      const newMessages = { ...state.messages };
      delete newMessages[eventId];
      return { messages: newMessages };
    });
  },
}));

