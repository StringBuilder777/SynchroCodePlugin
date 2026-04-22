import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import type { Project } from "./types";
import { normalizeUserError } from "@/lib/errors";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Pick<Project, "name" | "description" | "startDate" | "endDate">) => Promise<void>;
  project?: Project | null;
}

export function ProjectFormDialog({ open, onClose, onSave, project }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setStartDate(project.startDate);
      setEndDate(project.endDate);
    } else {
      setName(""); setDescription(""); setStartDate(""); setEndDate("");
    }
    setError("");
    setLoading(false);
  }, [project, open]);

  async function handleSave() {
    if (!name.trim()) { setError("El nombre es obligatorio."); return; }
    if (startDate && endDate && endDate < startDate) {
      setError("La fecha de fin no puede ser anterior a la de inicio."); return;
    }
    
    setLoading(true);
    setError("");
    try {
      await onSave({ name: name.trim(), description: description.trim(), startDate, endDate });
    } catch (e: unknown) {
      setError(
        normalizeUserError(e, {
          fallback: "No se pudo guardar el proyecto.",
          duplicateMessage: "Ya existe un proyecto con ese nombre.",
          invalidDataMessage: "Verifica los datos del proyecto e inténtalo de nuevo.",
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{project ? "Editar Proyecto" : "Nuevo Proyecto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label>Nombre del proyecto</Label>
            <Input placeholder="Ej: Portal de clientes v2" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea placeholder="Objetivo y alcance del proyecto" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={loading} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de inicio</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de fin estimada</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={loading} />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" onClick={handleSave} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
          <Button variant="outline" className="w-full" onClick={onClose} disabled={loading}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
