import { useState } from "react";
import { X, Upload } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  isLoading?: boolean;
}

export function UploadEvidenceDialog({ open, onClose, onUpload, isLoading = false }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected) return;
    setFiles((prev) => [...prev, ...Array.from(selected)]);
  }

  function handleDrag(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files;
    if (dropped) {
      setFiles((prev) => [...prev, ...Array.from(dropped)]);
    }
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleUpload() {
    onUpload(files);
    setFiles([]);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-[520px] w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white">Subir Evidencia</h2>
            <p className="text-xs text-zinc-400 mt-1">Adjunta capturas, diagramas o logs. Máximo 50 MB por archivo.</p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-zinc-500 hover:text-white transition-colors disabled:opacity-50 bg-transparent border-0 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer ${
              dragActive
                ? "border-blue-500 bg-blue-500/5"
                : "border-zinc-700 hover:border-blue-500/50 hover:bg-blue-500/5"
            }`}
          >
            <label className="flex cursor-pointer flex-col items-center gap-3 w-full">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-medium text-xs text-zinc-200">Haz clic para seleccionar o arrastra archivos aquí</p>
                <p className="text-[10px] text-zinc-500 mt-1">PNG, JPG, PDF, TXT (máx. 50 MB)</p>
              </div>
              <input
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.pdf,.txt,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isLoading}
              />
            </label>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-400">Archivos seleccionados ({files.length})</p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-zinc-200 truncate">{f.name}</div>
                      <div className="text-[10px] text-zinc-500">{(f.size / 1024).toFixed(0)} KB</div>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      disabled={isLoading}
                      className="text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50 bg-transparent border-0 cursor-pointer p-1 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 p-4 bg-zinc-950/50">
          <button
            onClick={() => {
              onClose();
              setFiles([]);
            }}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-zinc-400 bg-transparent border border-zinc-700 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isLoading}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-3 h-3" />
                Subir archivos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
