import { api } from "./api";

export interface ChatChannel {
  channelId: string; // El backend lo llama channelId
  projectId: string;
  name: string;
  websocketPath?: string; // El backend lo llama websocketPath
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  imageUrls: string[];
  sentAt: string;
  editedAt?: string;
}

export const chatService = {
  listChannels: async (projectId: string): Promise<ChatChannel[]> => {
    return api.get<ChatChannel[]>(`/chat/channels?projectId=${projectId}`);
  },

  createChannel: async (projectId: string, name: string): Promise<ChatChannel> => {
    return api.post<ChatChannel>("/chat/channels", { projectId, name });
  },

  getWsUrl: (path: string | undefined, userId: string, channelId: string): string => {
    const effectivePath = path || `/ws/chat/${channelId}`;
    
    if (effectivePath.startsWith("ws")) {
      return `${effectivePath}${effectivePath.includes("?") ? "&" : "?"}userId=${userId}`;
    }

    const baseUrl = import.meta.env.PUBLIC_API_URL || "http://localhost:8080";
    const wsBaseUrl = baseUrl.replace(/^http/, "ws");
    
    const cleanPath = effectivePath.startsWith("/") ? effectivePath : `/${effectivePath}`;
    return `${wsBaseUrl}${cleanPath}?userId=${userId}`;
  }
};
