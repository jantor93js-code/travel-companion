import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const STORAGE_BUCKET = "travel-documents";

export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

const normalizeFileName = (fileName: string) =>
  fileName.trim().replace(/[^a-zA-Z0-9._-]/g, "_");

export const buildDocumentPath = (
  tripId: string,
  documentType: "ticket" | "reservation",
  fileName: string,
): string => {
  const folder = documentType === "ticket" ? "tickets" : "reservations";
  return `trips/${tripId}/${folder}/${normalizeFileName(fileName)}`;
};

export const uploadPdfToSupabase = async (
  tripId: string,
  file: File,
  documentType: "ticket" | "reservation",
): Promise<string> => {
  if (!supabase) {
    return "";
  }

  const path = buildDocumentPath(tripId, documentType, file.name);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "application/pdf",
  });

  if (error) {
    throw error;
  }

  return path;
};

export const deleteFileFromSupabase = async (path: string): Promise<void> => {
  if (!supabase || !path) {
    return;
  }

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) {
    throw error;
  }
};

export const getDocumentUrl = (path: string): string => {
  if (!supabase || !path) {
    return "";
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};
