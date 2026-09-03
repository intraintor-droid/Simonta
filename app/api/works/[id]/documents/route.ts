import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/current-user";
import { logAudit, notifyUsers } from "@/lib/audit";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
]);
const ALLOWED_EXT = new Set(["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"]);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: workId } = await params;
  try {
    const profile = await requireUser();
    const supabase = await createClient();

    // Pastikan pekerjaan ada & user berhak mengaksesnya (RLS akan double-check juga).
    const { data: work, error: workError } = await supabase
      .from("works")
      .select("id, title, responsible_user_id")
      .eq("id", workId)
      .single();
    if (workError || !work) {
      return NextResponse.json({ error: "Pekerjaan tidak ditemukan" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak valid" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Tipe file tidak diizinkan. Gunakan PDF, DOC(X), XLS(X), JPG, atau PNG." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 400 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${workId}/${crypto.randomUUID()}-${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("work-documents")
      .upload(path, arrayBuffer, { contentType: file.type });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data: doc, error: dbError } = await supabase
      .from("work_documents")
      .insert({
        work_id: workId,
        uploaded_by: profile.id,
        file_name: file.name,
        file_path: path,
        file_type: file.type,
        file_size: file.size,
      })
      .select()
      .single();
    if (dbError) {
      await supabase.storage.from("work-documents").remove([path]);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    await supabase.from("work_updates").insert({
      work_id: workId,
      user_id: profile.id,
      notes: `Dokumen ditambahkan: ${file.name}`,
    });

    if (work.responsible_user_id && work.responsible_user_id !== profile.id) {
      await notifyUsers(supabase, {
        userIds: [work.responsible_user_id],
        title: "Dokumen baru ditambahkan",
        message: file.name,
        type: "DOCUMENT_ADDED",
        relatedWorkId: workId,
      });
    }

    await logAudit(supabase, {
      userId: profile.id,
      action: "UPLOAD_DOCUMENT",
      module: "WORK_DOCUMENT",
      recordId: doc.id,
      newData: { file_name: file.name, work_id: workId },
    });

    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    return NextResponse.json(
      { error: status === 403 ? "Forbidden" : "Terjadi kesalahan server" },
      { status }
    );
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: workId } = await params;
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("work_documents")
    .select("*")
    .eq("work_id", workId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
