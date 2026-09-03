"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Power, Search, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { userFormSchema, type UserFormValues } from "@/lib/validations/master";
import { createUser, updateUser, setUserActive, type CreateUserValues } from "@/app/(app)/users/actions";
import type { Profile } from "@/types";

type ProfileWithUnit = Profile & { unit: { id: string; name: string } | null };

const ROLE_VARIANT: Record<string, "destructive" | "info" | "secondary"> = {
  SUPERADMIN: "destructive",
  ADMIN: "info",
  USER: "secondary",
};

export function UserTable({
  initialData,
  units,
}: {
  initialData: ProfileWithUnit[];
  units: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProfileWithUnit | null>(null);
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const form = useForm<UserFormValues & { password?: string }>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      full_name: "",
      nip: "",
      phone: "",
      position: "",
      unit_id: "",
      role: "USER",
      is_active: true,
    },
  });

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function openCreate() {
    setEditing(null);
    form.reset({
      email: "",
      full_name: "",
      nip: "",
      phone: "",
      position: "",
      unit_id: "",
      role: "USER",
      is_active: true,
      password: "",
    });
    setDialogOpen(true);
  }

  function openEdit(user: ProfileWithUnit) {
    setEditing(user);
    form.reset({
      email: user.email,
      full_name: user.full_name,
      nip: user.nip ?? "",
      phone: user.phone ?? "",
      position: user.position ?? "",
      unit_id: user.unit_id ?? "",
      role: user.role,
      is_active: user.is_active,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: UserFormValues & { password?: string }) {
    try {
      if (editing) {
        const updated = await updateUser(editing.id, values);
        setUsers((prev) =>
          prev.map((u) => (u.id === editing.id ? { ...u, ...updated } : u))
        );
        toast.success("User berhasil diperbarui");
      } else {
        if (!values.password || values.password.length < 8) {
          toast.error("Password minimal 8 karakter untuk akun baru");
          return;
        }
        const created = await createUser(values as CreateUserValues);
        setUsers((prev) => [...prev, { ...created, unit: null } as ProfileWithUnit]);
        toast.success("User berhasil dibuat");
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan user");
    }
  }

  async function onToggleActive(user: ProfileWithUnit) {
    try {
      await setUserActive(user.id, !user.is_active);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      );
      toast.success(user.is_active ? "User dinonaktifkan" : "User diaktifkan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah status");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari nama / email / NIP..."
            className="pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateParam("q", q)}
            onBlur={() => updateParam("q", q)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          defaultValue={searchParams.get("role") ?? ""}
          onChange={(e) => updateParam("role", e.target.value)}
        >
          <option value="">Semua Role</option>
          <option value="SUPERADMIN">Superadmin</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>
        <select
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          defaultValue={searchParams.get("unit") ?? ""}
          onChange={(e) => updateParam("unit", e.target.value)}
        >
          <option value="">Semua Unit</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <Button onClick={openCreate} className="ml-auto">
          <Plus className="h-4 w-4" /> Tambah User
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="Belum ada user" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">NIP</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Jabatan</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{u.full_name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{u.nip ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3 text-slate-500">{u.position ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{u.unit?.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_VARIANT[u.role]}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.is_active ? "success" : "secondary"}>
                      {u.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onToggleActive(u)}>
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Tambah User"}</DialogTitle>
            <DialogCloseButton onClick={() => setDialogOpen(false)} />
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" disabled={!!editing} {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
            {!editing && (
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="password">Password Awal</Label>
                <Input id="password" type="password" {...form.register("password")} />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input id="full_name" {...form.register("full_name")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nip">NIP</Label>
              <Input id="nip" {...form.register("nip")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Nomor HP</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="position">Jabatan</Label>
              <Input id="position" {...form.register("position")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unit_id">Unit</Label>
              <select
                id="unit_id"
                className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                {...form.register("unit_id")}
              >
                <option value="">Tanpa unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                {...form.register("role")}
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPERADMIN">Superadmin</option>
              </select>
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting} className="sm:col-span-2">
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
