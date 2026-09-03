import { z } from "zod";

export const unitFormSchema = z.object({
  code: z.string().min(1, "Kode wajib diisi").max(20),
  name: z.string().min(3, "Nama wajib diisi").max(150),
  description: z.string().max(500).optional().nullable(),
  head_user_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean(),
});
export type UnitFormValues = z.infer<typeof unitFormSchema>;

export const categoryFormSchema = z.object({
  code: z.string().min(1, "Kode wajib diisi").max(20),
  name: z.string().min(3, "Nama wajib diisi").max(150),
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean(),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const userFormSchema = z.object({
  email: z.string().email("Email tidak valid"),
  full_name: z.string().min(3, "Nama wajib diisi").max(150),
  nip: z.string().max(30).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  position: z.string().max(150).optional().nullable(),
  unit_id: z.string().uuid().optional().nullable(),
  role: z.enum(["SUPERADMIN", "ADMIN", "USER"]),
  is_active: z.boolean(),
});
export type UserFormValues = z.infer<typeof userFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;
