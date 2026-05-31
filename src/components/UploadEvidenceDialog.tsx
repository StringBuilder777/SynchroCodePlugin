import { useState, useEffect } from 'react';
import { tasksService } from '../lib/tasks';

interface Props {
  taskId?: string;
}

export function UploadEvidenceDialog({ taskId: initialTaskId }: Props) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [taskId, setTaskId] = useState(initialTaskId || '');

  useEffect(() => {
    const handleOpenDialog = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.taskId) {
        setTaskId(customEvent.detail.taskId);
      }
      setOpen(true);
    };
    window.addEventListener('openUploadDialog', handleOpenDialog);
    return () => window.removeEventListener('openUploadDialog', handleOpenDialog);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    setFiles((prev) => [...prev, ...Array.from(selected)]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !taskId) return;
    setIsLoading(true);
    try {
      await tasksService.uploadEvidence(taskId, files);
      setFiles([]);
      setOpen(false);

      // Reload task detail
      const taskDetailError = document.getElementById('taskDetailError') as HTMLElement | null;
      if (taskDetailError) {
        const event = new CustomEvent('reloadTaskDetail');
        window.dispatchEvent(event);
      }

      // Show success
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed bottom-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded shadow-lg text-sm';
      successMsg.textContent = 'Evidencia subida exitosamente';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (error) {
      console.error('Error uploading evidence:', error);
      const errorMsg = document.createElement('div');
      errorMsg.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg text-sm';
      errorMsg.textContent = 'Error al subir evidencia';
      document.body.appendChild(errorMsg);
      setTimeout(() => errorMsg.remove(), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-[520px] mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">Subir Evidencia</h2>
          <p className="text-sm text-zinc-400 mt-1">Adjunta capturas, diagramas o logs como evidencia de la tarea. Máximo 50 MB por archivo.</p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Drop zone */}
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-zinc-700 p-8 hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors">
            <div className="flex w-12 h-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
              <span className="material-symbols-outlined text-[24px]">upload_file</span>
            </div>
            <div className="text-center">
              <p className="font-medium text-sm text-zinc-200">Haz clic para seleccionar o arrastra archivos aquí</p>
              <p className="text-xs text-zinc-500 mt-1">Soporta PNG, JPG, PDF y documentos</p>
            </div>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              disabled={isLoading}
            />
          </label>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => {
                const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(f.name);
                const size = f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`;

                return (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <div className={`flex w-9 h-9 items-center justify-center rounded text-[18px] shrink-0 ${isImage ? 'bg-blue-500/15 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      <span className="material-symbols-outlined text-[18px]">
                        {isImage ? 'image' : 'description'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-200 truncate">{f.name}</div>
                      <div className="text-xs text-zinc-500">{size}</div>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      disabled={isLoading}
                      className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex gap-2 justify-end">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 rounded text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50 bg-transparent border border-zinc-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isLoading}
            className="px-4 py-2 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px] inline">hourglass_empty</span>
                Subiendo...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px] inline">upload</span>
                Subir archivos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
