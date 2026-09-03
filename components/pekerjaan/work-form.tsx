"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { workFormSchema, type WorkFormValues } from "@/lib/validations/work";
import { WORK_STATUS_LABEL, WORK_PRIORITY_LABEL } from "@/types";
import { createWork, updateWorkFull } from "@/app/(app)/pekerjaan/actions";

interface Option {
  id: string;
  name: string;
}

export function WorkForm({
  workId,
  defaultValues,
  categories,
  units,
  users,
}: {
  workId?: string;
  defaultValues?: Partial<WorkFormValues>;
  categories: Option[];
  units: Option[];
  users: Option[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<WorkFormValues>({
    resolver: zodResolver(workFormSchema),
    defaultValues: {
      work_number: "",
      title: "",
      description: "",
      priority: "SEDANG",
      status: "BELUM_DIMULAI",
      progress: 0,
      assignee_ids: [],
      notes: "",
      ...defaultValues,
    },
  });

  const selectedAssignees = watch("assignee_ids") ?? [];

  async function onSubmit(values: WorkFormValues) {
    setSubmitting(true);
    try {
      if (workId) {
        await updateWorkFull(workId, values);
        toast.success("Pekerjaan berhasil diperbarui");
        router.push(`/pekerjaan/${workId}`);
      } else {
        const created = await createWork(values);
        toast.success("Pekerjaan berhasil dibuat");
        router.push(`/pekerjaan/${created.id}`);
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan pekerjaan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="work_number">Nomor Pekerjaan</Label>
        <Input id="work_number" {...register("work_number")} placeholder="mis. PKJ/2026/001" />
        {errors.work_number && <p className="text-xs text-red-500">{errors.work_number.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Nama Pekerjaan</Label>
        <Input id="title" {...register("title")} />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea id="description" {...register("description")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category_id">Kategori</Label>
        <select
          id="category_id"
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          {...register("category_id")}
        >
          <option value="">Pilih kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.category_id && <p className="text-xs text-red-500">{errors.category_id.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="unit_id">Unit</Label>
        <select
          id="unit_id"
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          {...register("unit_id")}
        >
          <option value="">Pilih unit</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        {errors.unit_id && <p className="text-xs text-red-500">{errors.unit_id.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="responsible_user_id">Penanggung Jawab</Label>
        <select
          id="responsible_user_id"
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          {...register("responsible_user_id")}
        >
          <option value="">Pilih penanggung jawab</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        {errors.responsible_user_id && (
          <p className="text-xs text-red-500">{errors.responsible_user_id.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Pelaksana Tambahan</Label>
        <Controller
          control={control}
          name="assignee_ids"
          render={({ field }) => (
            <select
              multiple
              className="h-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={field.value}
              onChange={(e) =>
                field.onChange(Array.from(e.target.selectedOptions, (o) => o.value))
              }
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        />
        <p className="text-xs text-slate-400">{selectedAssignees.length} dipilih (Ctrl/Cmd+klik untuk multi-pilih)</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="priority">Prioritas</Label>
        <select
          id="priority"
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          {...register("priority")}
        >
          {Object.entries(WORK_PRIORITY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          {...register("status")}
        >
          {Object.entries(WORK_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="progress">Progress (%)</Label>
        <Input id="progress" type="number" min={0} max={100} {...register("progress")} />
        {errors.progress && <p className="text-xs text-red-500">{errors.progress.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="start_date">Tanggal Mulai</Label>
        <Input id="start_date" type="date" {...register("start_date")} />
        {errors.start_date && <p className="text-xs text-red-500">{errors.start_date.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="deadline">Deadline</Label>
        <Input id="deadline" type="date" {...register("deadline")} />
        {errors.deadline && <p className="text-xs text-red-500">{errors.deadline.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>

      <div className="flex justify-end gap-2 md:col-span-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Simpan
        </Button>
      </div>
    </form>
  );
}
