import React, { useState, useEffect } from 'react';
import { ActiveSessionsList } from './ActiveSessionsList';
import { CollaborativeChat } from './CollaborativeChat';
import { collaborativeSessionsService } from '../../lib/collaborativeSessions';
import { projectsService } from '../../lib/projects';
import { ScreenShare, Plus, FolderSync, X, Hash, MessageSquare } from 'lucide-react';
import type { Project } from '../proyectos/types';
import { normalizeUserError } from '../../lib/errors';
import { ErrorBoundary } from './ErrorBoundary';

export function CollabApp() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionName, setActiveSessionName] = useState<string>('');
  const [activePasscode, setActivePasscode] = useState<string | undefined>(undefined);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  // States for In-UI Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createName, setCreateName] = useState('Nueva Sesión Colaborativa');
  const [createCommit, setCreateCommit] = useState('HEAD');

  const [joiningSession, setJoiningSession] = useState<{id: string, name: string} | null>(null);
  const [joinPasscode, setJoinPasscode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    projectsService.getAll().then(data => {
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    }).catch(err => {
      console.error("Error cargando proyectos para sesión:", err);
    });
  }, []);

  const handleCreateSession = async () => {
    if (!selectedProjectId || !createName.trim() || !createCommit.trim()) return;

    setIsCreating(true);
    try {
      const res = await collaborativeSessionsService.createSession({
        projectId: selectedProjectId,
        initialCommitHash: createCommit
      });
      setActiveSessionId(res.sessionId);
      setActiveSessionName(createName.trim());
      setActivePasscode(res.passcode);
      setShowCreateDialog(false);
    } catch (err: any) {
      console.error(err);
      alert("Error al crear la sesión: " + (err.message || 'Error desconocido'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinConfirm = async () => {
    if (!joiningSession || isJoining) return;
    
    const passcode = joinPasscode.trim();
    if (!passcode) return;

    setIsJoining(true);
    setJoinError(null);

    try {
      await collaborativeSessionsService.joinSession(joiningSession.id, passcode);
      
      // Success: register states and transition
      setActiveSessionId(joiningSession.id);
      setActiveSessionName(joiningSession.name);
      setActivePasscode(passcode);
      setJoiningSession(null);
      setJoinPasscode('');
    } catch (err: any) {
      console.error("Join error:", err);
      setJoinError(
        normalizeUserError(err, {
          fallback: "No se pudo unir a la sesión.",
          forbiddenMessage: "Código de acceso incorrecto.",
          invalidDataMessage: "Código de acceso incorrecto.",
        })
      );
    } finally {
      setIsJoining(false);
    }
  };

  const projectNamesById = projects.reduce<Record<string, string>>((acc, project) => {
    acc[project.id] = project.name;
    return acc;
  }, {});

  if (activeSessionId) {
    return (
      <ErrorBoundary>
        <div className="flex-1 flex flex-col p-3 overflow-hidden w-full h-full min-h-[600px]">
          <CollaborativeChat 
            sessionId={activeSessionId} 
            sessionName={activeSessionName}
            passcode={activePasscode}
            onBack={() => {
              setActiveSessionId(null);
              setActivePasscode(undefined);
            }} 
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 flex flex-col gap-6 relative">
      
      {/* Create Session Dialog Overlay */}
      {showCreateDialog && (
        <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm p-6 flex flex-col justify-center animate-in fade-in zoom-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" /> Configurar Sesión
              </h4>
              <button onClick={() => setShowCreateDialog(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1.5 ml-1">
                  <MessageSquare className="w-3 h-3" /> Nombre
                </label>
                <input 
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded-md p-2.5 outline-none focus:border-blue-500 transition-colors"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  placeholder="Ej: Fix de bugs críticos"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1.5 ml-1">
                  <Hash className="w-3 h-3" /> Commit / Rama
                </label>
                <input 
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded-md p-2.5 outline-none focus:border-blue-500 transition-colors"
                  value={createCommit}
                  onChange={e => setCreateCommit(e.target.value)}
                  placeholder="Ej: main o a1b2c3d"
                />
              </div>
            </div>

            <button 
              onClick={handleCreateSession}
              disabled={isCreating || !createName.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
            >
              {isCreating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Iniciar Sesión Ahora"}
            </button>
          </div>
        </div>
      )}

      {/* Join Session Dialog Overlay */}
      {joiningSession && (
        <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm p-6 flex flex-col justify-center animate-in fade-in zoom-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Unirse a {joiningSession.name}
              </h4>
              <button onClick={() => setJoiningSession(null)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold ml-1">Código de Acceso</label>
              <input 
                autoFocus
                disabled={isJoining}
                className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 text-center tracking-[0.2em] font-mono text-sm rounded-md p-3 outline-none focus:border-blue-500 disabled:opacity-50"
                value={joinPasscode}
                onChange={e => setJoinPasscode(e.target.value.toUpperCase())}
                placeholder="ABC-123"
                onKeyDown={e => e.key === 'Enter' && handleJoinConfirm()}
              />
              {joinError && (
                <p className="text-[10px] text-red-400 mt-2 ml-1 animate-shake">
                  ⚠ {joinError}
                </p>
              )}
            </div>

            <button 
              onClick={handleJoinConfirm}
              disabled={isJoining || !joinPasscode.trim()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/10"
            >
              {isJoining ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : "Entrar a la Sala"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center py-4 gap-2">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-inner">
          <ScreenShare className="w-8 h-8 text-blue-400" />
        </div>
        <p className="text-[13px] font-semibold text-slate-200 mt-1 uppercase tracking-wider">Sesiones Colaborativas</p>
        <p className="text-[11px] text-zinc-500 text-center leading-relaxed max-w-[220px]">
          Conéctate en tiempo real con otros desarrolladores.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 shadow-lg shadow-black/40">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5 ml-1">
            <FolderSync className="w-3 h-3" /> Proyecto Base
          </label>
          <select 
            className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded-lg p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all cursor-pointer"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects.length === 0 ? (
              <option value="">Cargando proyectos...</option>
            ) : (
              projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))
            )}
          </select>
        </div>

        <button 
          onClick={() => setShowCreateDialog(true)}
          disabled={!selectedProjectId}
          className="w-full py-3.5 bg-blue-600 disabled:bg-zinc-800 hover:bg-blue-500 disabled:text-zinc-600 text-white rounded-lg font-bold text-[12px] flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-900/10"
        >
          <Plus className="w-4 h-4" />
          Crear nueva sesión
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-zinc-800"></div>
        <span className="text-[10px] text-zinc-600 shrink-0 uppercase tracking-widest font-black">Activas</span>
        <div className="flex-1 border-t border-zinc-800"></div>
      </div>

      <ActiveSessionsList
        projectNamesById={projectNamesById}
        onJoinSession={(id, name) => setJoiningSession({id, name})}
      />
    </div>
  );
}
