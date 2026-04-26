export interface CreateCollaborativeSessionRequest {
  projectId: string; // UUID
  taskId?: string; // UUID opcional
  initialCommitHash: string;
}

export interface StartCollaborativeSessionResponse {
  sessionId: string; // UUID
  passcode: string;
  websocketPath: string;
}

export interface JoinCollaborativeSessionRequest {
  passcode: string;
}

export interface JoinCollaborativeSessionResponse {
  sessionId: string;
  websocketPath: string;
}

export interface CollaborativeSessionSummaryResponse {
  sessionId: string;
  projectId: string;
  taskId: string | null;
  initiatedBy: string;
  initialCommitHash: string;
  startedAt: string;
  websocketPath: string;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: string;
  type: 'TEXT' | 'SYSTEM' | 'GIT_LINK';
}
