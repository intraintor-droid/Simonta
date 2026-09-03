import { z } from "zod";

export const workStatusEnum = z.enum([
  "BELUM_DIMULAI",
  "BERJALAN",
  "MENUNGGU",
  "SELESAI",
  "TERLAMBAT",
  "DIBATALKAN",
]);

export const workPriorityEnum = z.enum(["RENDAH", "SEDANG", "TINGGI", "MENDESAK"]);

export const workFormSchema = z
  .object({
    work_number: z.string().min(1, "Nomor pekerjaan wajib diisi").max(50),
    title: z.string().min(3, "Nama pekerjaan minimal 3 karakter").max(200),
    description: z.string().max(2000).optional().nullable(),
    category_id: z.string().uuid("Kategori wajib dipilih"),
    unit_id: z.string().uuid("Unit wajib dipilih"),
    responsible_user_id: z.string().uuid("Penanggung jawab wajib dipilih"),
    assignee_ids: z.array(z.string().uuid()),
    priority: workPriorityEnum,
    status: workStatusEnum,
    progress: z.coerce.number().int().min(0, "Minimal 0").max(100, "Maksimal 100"),
    start_date: z.string().min(1, "Tanggal mulai wajib diisi"),
    deadline: z.string().min(1, "Deadline wajib diisi"),
    notes: z.string().max(2000).optional().nullable(),
  })
  .refine((data) => new Date(data.deadline) >= new Date(data.start_date), {
    message: "Deadline tidak boleh sebelum tanggal mulai",
    path: ["deadline"],
  });

export type WorkFormValues = z.infer<typeof workFormSchema>;

export const workProgressUpdateSchema = z.object({
  progress: z.coerce.number().int().min(0).max(100),
  status: workStatusEnum,
  notes: z.string().max(2000).optional().nullable(),
});

export type WorkProgressUpdateValues = z.infer<typeof workProgressUpdateSchema>;
