"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Power, Tags } from "lucide-react";
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
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validations/master";
import {
  createCategory,
  updateCategory,
  toggleCategoryActive,
} from "@/app/(app)/master/kategori/actions";
import type { WorkCategory } from "@/types";

export function CategoryTable({
  initialData,
  canManage,
}: {
  initialData: WorkCategory[];
  canManage: boolean;
}) {
  const [items, setItems] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WorkCategory | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { code: "", name: "", description: "", is_active: true },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ code: "", name: "", description: "", is_active: true });
    setDialogOpen(true);
  }

  function openEdit(item: WorkCategory) {
    setEditing(item);
    form.reset({
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      is_active: item.is_active,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: CategoryFormValues) {
    try {
      if (editing) {
        const updated = await updateCategory(editing.id, values);
        setItems((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
        toast.success("Kategori berhasil diperbarui");
      } else {
        const created = await createCategory(values);
        setItems((prev) => [...prev, created]);
        toast.success("Kategori berhasil ditambahkan");
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan kategori");
    }
  }

  async function onToggle(item: WorkCategory) {
    try {
      await toggleCategoryActive(item.id, !item.is_active);
      setItems((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, is_active: !c.is_active } : c))
      );
      toast.success(item.is_active ? "Kategori dinonaktifkan" : "Kategori diaktifkan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah status");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tambah Kategori
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={Tags} title="Belum ada kategori" description="Tambahkan kategori pekerjaan pertama." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Nama Kategori</th>
                <th className="px-4 py-3">Deskripsi</th>
                <th className="px-4 py-3">Status</th>
                {canManage && <th className="px-4 py-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.description ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.is_active ? "success" : "secondary"}>
                      {c.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onToggle(c)}>
                          <Power className="h-4 w-4" />
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
            <DialogTitle>{editing ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
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
              <Label htmlFor="name">Nama Kategori</Label>
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
