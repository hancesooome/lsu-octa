import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string)?.trim() || "";
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim() || "";

export function getSupabase() {
  if (!url || !anonKey) throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set");
  return createClient(url, anonKey);
}

const BUCKET = "research-files";

export type UploadType = "cover" | "pdf";

const COVER_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const PDF_MAX_SIZE = 20 * 1024 * 1024;  // 20MB
const COVER_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const PDF_TYPES = ["application/pdf"];

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

export function validateFile(file: File, type: UploadType): string | null {
  if (type === "cover") {
    if (!COVER_TYPES.includes(file.type)) return "Cover must be JPG or PNG.";
    if (file.size > COVER_MAX_SIZE) return "Cover image must be under 5MB.";
  } else {
    if (!PDF_TYPES.includes(file.type)) return "Document must be a PDF.";
    if (file.size > PDF_MAX_SIZE) return "PDF must be under 20MB.";
  }
  return null;
}

export async function uploadResearchFile(file: File, type: UploadType): Promise<string> {
  const sb = getSupabase();
  const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${sanitizeFileName(file.name)}`;
  const { data, error } = await sb.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}
