import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
}

export function UploadEvidenceDialog({ open, onClose, onUpload }: Props) {
  const [files, setFiles] = useState<File[]>([]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected) return;
    setFiles((prev) => [...prev, ...Array.from(selected)]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleUpload() {
    onUpload(files);
    setFiles([]);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setFiles([]); } }}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Subir Evidencia</DialogTitle>
          <p className="text-sm text-muted-foreground">Adjunta capturas, diagramas o logs como evidencia de la tarea. Máximo 50 MB por archivo.</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 hover:border-primary/50 transition-colors">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">Haz clic para seleccionar o arrastra archivos aquí</p>
              <p className="text-xs text-muted-foreground">Soporta PNG, JPG, PDF y TXT</p>
            </div>
            <input type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.txt" className="hidden" onChange={handleFileSelect} />
          </label>

          {/* File list */}
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <div className={`flex size-9 items-center justify-center rounded-lg ${f.name.match(/\.(png|jpg|jpeg)$/i) ? "bg-blue-500/15 text-blue-500" : "bg-rose-500/15 text-rose-500"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{f.name}</div>
                <div className="text-xs text-muted-foreground">{f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`}</div>
              </div>
              <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => removeFile(i)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setFiles([]); }}>Cancelar</Button>
          <Button onClick={handleUpload} disabled={files.length === 0}>Subir archivos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
