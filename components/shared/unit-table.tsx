"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2 } from "lucide-react";
import { unitFormSchema, type UnitFormValues } from "@/lib/validations/master";
import {
  createUnit,
  updateUnit,
  toggleUnitActive,
  deleteUnit,
  getUnitUsageCount,
} from "@/app/(app)/master/unit/actions";
import type { Unit } from "@/types";

export function UnitTable({
  initialData,
  canManage,
}: {
  initialData: Unit[];
  canManage: boolean;
}) {
  const [units, setUnits] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: { code: "", name: "", description: "", is_active: true },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ code: "", name: "", description: "", is_active: true });
    setDialogOpen(true);
  }

  function openEdit(unit: Unit) {
    setEditing(unit);
    form.reset({
      code: unit.code,
      name: unit.name,
      description: unit.description ?? "",
      is_active: unit.is_active,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: UnitFormValues) {
    try {
      if (editing) {
        const updated = await updateUnit(editing.id, values);
        setUnits((prev) => prev.map((u) => (u.id === editing.id ? updated : u)));
        toast.success("Unit berhasil diperbarui");
      } else {
        const created = await createUnit(values);
        setUnits((prev) => [...prev, created]);
        toast.success("Unit berhasil ditambahkan");
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan unit");
    }
  }

  async function onToggle(unit: Unit) {
    try {
      await toggleUnitActive(unit.id, !unit.is_active);
      setUnits((prev) =>
        prev.map((u) => (u.id === unit.id ? { ...u, is_active: !u.is_active } : u))
      );
      toast.success(unit.is_active ? "Unit dinonaktifkan" : "Unit diaktifkan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah status");
    }
  }

  async function onDelete(unit: Unit) {
    try {
      const usage = await getUnitUsageCount(unit.id);
      const parts: string[] = [];
      if (usage.workCount > 0) parts.push(`${usage.workCount} pekerjaan`);
      if (usage.userCount > 0) parts.push(`${usage.userCount} user`);
      const warning =
        parts.length > 0
          ? `Unit ini masih dipakai oleh ${parts.join(" dan ")}. Data tersebut TIDAK akan ikut terhapus, tapi kolom unit-nya akan menjadi kosong. `
          : "";
      const confirmed = confirm(
        `${warning}Hapus unit "${unit.name}" secara permanen? Tindakan ini tidak dapat dibatalkan.\n\nJika ragu, gunakan tombol nonaktifkan (ikon daya) saja.`
      );
      if (!confirmed) return;
      await deleteUnit(unit.id);
      setUnits((prev) => prev.filter((u) => u.id !== unit.id));
      toast.success("Unit berhasil dihapus");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus unit");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tambah Unit
          </Button>
        </div>
      )}

      {units.length === 0 ? (
        <EmptyState icon={Building2} title="Belum ada unit" description="Tambahkan satuan kerja pertama." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Nama Unit</th>
                <th className="px-4 py-3">Deskripsi</th>
                <th className="px-4 py-3">Status</th>
                {canManage && <th className="px-4 py-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-mono text-xs">{u.code}</td>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.description ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.is_active ? "success" : "secondary"}>
                      {u.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onToggle(u)} title="Aktifkan/Nonaktifkan">
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(u)}
                          title="Hapus permanen"
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Unit" : "Tambah Unit"}</DialogTitle>
            <DialogCloseButton onClick={() => setDialogOpen(false)} />
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">Kode</Label>
              <Input id="code" {...form.register("code")} />
              {form.formState.errors.code && (
                <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nama Unit</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea id="description" {...form.register("description")} />
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
