import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/current-user";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  await requireUser();
  const { docId } = await params;
  const supabase = await createClient();

  // RLS pada work_documents & storage.objects yang menentukan apakah user boleh akses.
  const { data: doc, error } = await supabase
    .from("work_documents")
    .select("file_path, file_name")
    .eq("id", docId)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Dokumen tidak ditemukan atau tidak diizinkan" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("work-documents")
    .createSignedUrl(doc.file_path, 60); // berlaku 60 detik

  if (signError || !signed) {
    return NextResponse.json({ error: "Gagal membuat tautan unduhan" }, { status: 400 });
  }

  return NextResponse.json({ url: signed.signedUrl, file_name: doc.file_name });
}
