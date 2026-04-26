import { api } from "./api";
import type { 
  CreateCollaborativeSessionRequest, 
  StartCollaborativeSessionResponse,
  JoinCollaborativeSessionRequest,
  JoinCollaborativeSessionResponse,
  CollaborativeSessionSummaryResponse
} from "./collaborative-types";

export const collaborativeSessionsService = {
  createSession: (data: CreateCollaborativeSessionRequest) => 
    api.post<StartCollaborativeSessionResponse>("/collaborative-sessions", data),
    
  getActiveSessions: () => 
    api.get<CollaborativeSessionSummaryResponse[]>("/collaborative-sessions/active"),
    
  joinSession: (sessionId: string, passcode: string) => 
    api.post<JoinCollaborativeSessionResponse>(`/collaborative-sessions/${sessionId}/join`, { passcode }),
};
