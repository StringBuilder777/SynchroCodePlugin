import React, { useEffect, useState } from 'react';
import { collaborativeSessionsService } from '../../lib/collaborativeSessions';
import type { CollaborativeSessionSummaryResponse } from '../../lib/collaborative-types';
import { Clock, Play, Hash } from 'lucide-react';

interface ActiveSessionsListProps {
  projectNamesById: Record<string, string>;
  onJoinSession: (sessionId: string, sessionName: string) => void;
}

export function ActiveSessionsList({ projectNamesById, onJoinSession }: ActiveSessionsListProps) {
  const [sessions, setSessions] = useState<CollaborativeSessionSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    collaborativeSessionsService.getActiveSessions()
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching active sessions:', err);
        setError('No se pudieron cargar las sesiones activas.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-zinc-400 text-sm py-4">Cargando sesiones...</div>;
  if (error) return <div className="text-red-400 text-sm py-4">{error}</div>;
  if (sessions.length === 0) return <div className="text-zinc-500 text-sm italic py-4">No hay sesiones activas en este momento.</div>;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-2">Sesiones Activas</h3>
      {sessions.map(session => {
        const sessionName = `${projectNamesById[session.projectId] ?? 'Proyecto'} · ${session.initialCommitHash}`;
        return (
        <div 
          key={session.sessionId} 
          className="p-3 bg-zinc-800/60 border border-zinc-700/60 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer group relative overflow-hidden"
          onClick={() => onJoinSession(session.sessionId, sessionName)}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-zinc-200 group-hover:text-white transition-colors truncate pr-2">{sessionName}</span>
            <Play className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-center space-x-4 text-xs text-zinc-400 mt-2">
            <span className="flex items-center bg-zinc-900/50 px-2 py-0.5 rounded">
              <Hash className="w-3 h-3 mr-1.5 text-zinc-500" />
              {session.sessionId.slice(0, 8)}
            </span>
            <span className="flex items-center bg-zinc-900/50 px-2 py-0.5 rounded">
              <Clock className="w-3 h-3 mr-1.5 text-zinc-500" />
              {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        );
      })}
    </div>
  );
}
