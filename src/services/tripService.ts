import type { Trip } from "../types/trip";
import { db, firebaseEnabled } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  deleteFileFromSupabase,
  getDocumentUrl,
  uploadPdfToSupabase,
} from "./supabase";

const LOCAL_STORAGE_KEY = "trips";
const TRIPS_COLLECTION = "trips";

export const readTripsFromLocalStorage = (): Trip[] => {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeTripsToLocalStorage = (trips: Trip[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trips));
};

const uploadFile = async (
  tripId: string,
  file: File,
  documentType: "ticket" | "reservation",
): Promise<string> => {
  return uploadPdfToSupabase(tripId, file, documentType);
};


const prepareTripForFirestore = <T extends Trip>(input: T): T => {
  try {
    return (typeof structuredClone === "function"
      ? structuredClone(input)
      : JSON.parse(JSON.stringify(input))) as T;
  } catch {
    return JSON.parse(JSON.stringify(input)) as T;
  }
};

export const fetchTrips = async (): Promise<Trip[]> => {
  if (!firebaseEnabled || !db) return readTripsFromLocalStorage();

  const snapshot = await getDocs(collection(db, TRIPS_COLLECTION));
  const trips: Trip[] = [];

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    trips.push({
      id: docSnapshot.id,
      professorName: data.professorName ?? "",
      professorEmail: data.professorEmail ?? "",
      coordinatorPhone: data.coordinatorPhone ?? "",
      accessToken: data.accessToken ?? "",
      startDate: data.startDate ?? "",
      endDate: data.endDate ?? "",
      segments: Array.isArray(data.segments) ? data.segments : [],
      stays: Array.isArray(data.stays) ? data.stays : [],
      createdAt: data.createdAt ?? "",
      updatedAt: data.updatedAt ?? "",
    });
  });

  return trips;
};

export const fetchTripById = async (tripId: string): Promise<Trip | null> => {
  if (firebaseEnabled && db) {
    const docRef = doc(db, TRIPS_COLLECTION, tripId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        id: snapshot.id,
        professorName: data.professorName ?? "",
        professorEmail: data.professorEmail ?? "",
        coordinatorPhone: data.coordinatorPhone ?? "",
        accessToken: data.accessToken ?? "",
        startDate: data.startDate ?? "",
        endDate: data.endDate ?? "",
        segments: Array.isArray(data.segments) ? data.segments : [],
        stays: Array.isArray(data.stays) ? data.stays : [],
        createdAt: data.createdAt ?? "",
        updatedAt: data.updatedAt ?? "",
      };
    }
  }

  const localTrips = readTripsFromLocalStorage();
  return localTrips.find((trip) => trip.id === tripId) ?? null;
};

export const deleteTripById = async (tripId: string) => {
  const localTrips = readTripsFromLocalStorage();
  let tripToDelete = localTrips.find((trip) => trip.id === tripId);

  if (firebaseEnabled && db) {
    const snapshot = await getDoc(doc(db, TRIPS_COLLECTION, tripId));
    if (snapshot.exists()) {
      const data = snapshot.data();
      tripToDelete = {
        id: snapshot.id,
        professorName: data.professorName ?? "",
        professorEmail: data.professorEmail ?? "",
        coordinatorPhone: data.coordinatorPhone ?? "",
        accessToken: data.accessToken ?? "",
        startDate: data.startDate ?? "",
        endDate: data.endDate ?? "",
        segments: Array.isArray(data.segments) ? data.segments : [],
        stays: Array.isArray(data.stays) ? data.stays : [],
        createdAt: data.createdAt ?? "",
        updatedAt: data.updatedAt ?? "",
      };
    }
  }

  if (tripToDelete) {
    const documentPaths = [
      ...tripToDelete.segments
        .map((segment) => segment.ticketPath)
        .filter((value): value is string => Boolean(value)),
      ...tripToDelete.stays
        .map((stay) => stay.reservationPath)
        .filter((value): value is string => Boolean(value)),
    ];

    await Promise.all(documentPaths.map((path) => deleteFileFromSupabase(path)));
  }

  if (firebaseEnabled && db) {
    await deleteDoc(doc(db, TRIPS_COLLECTION, tripId));
  }

  writeTripsToLocalStorage(localTrips.filter((trip) => trip.id !== tripId));
};

export const persistTrip = async (
  trip: Trip,
  segmentsWithFiles: Array<Trip["segments"][number] & { ticketFile?: File | null }> ,
  staysWithFiles: Array<Trip["stays"][number] & { reservationFile?: File | null }> ,
): Promise<Trip> => {
  const now = new Date().toISOString();
  const tripId = trip.id || crypto.randomUUID();

  const tripToSave: Trip = {
    ...trip,
    id: tripId,
    accessToken: trip.accessToken ?? crypto.randomUUID(),
    createdAt: trip.createdAt ?? now,
    updatedAt: now,
    segments: await Promise.all(
      segmentsWithFiles.map(async (segment) => {
        const file = (segment as unknown as { ticketFile?: File | null }).ticketFile as File | undefined;
        let ticketPath = segment.ticketPath ?? "";
        let ticketUrl = segment.ticketUrl ?? "";

        if (file) {
          const uploadedPath = await uploadFile(tripId, file, "ticket");
          ticketPath = uploadedPath;
          ticketUrl = getDocumentUrl(ticketPath);

          if (segment.ticketPath && segment.ticketPath !== ticketPath) {
            await deleteFileFromSupabase(segment.ticketPath);
          }
        }

        const { ticketFile, ...cleanedSegment } = segment as Trip["segments"][number] & { ticketFile?: File | null };
        void ticketFile;
        return {
          ...cleanedSegment,
          ticketPath,
          ticketUrl,
        };
      }),
    ),
    stays: await Promise.all(
      staysWithFiles.map(async (stay) => {
        const file = (stay as unknown as { reservationFile?: File | null }).reservationFile as File | undefined;
        let reservationPath = stay.reservationPath ?? "";
        let reservationUrl = stay.reservationUrl ?? "";

        if (file) {
          const uploadedPath = await uploadFile(tripId, file, "reservation");
          reservationPath = uploadedPath;
          reservationUrl = getDocumentUrl(reservationPath);

          if (stay.reservationPath && stay.reservationPath !== reservationPath) {
            await deleteFileFromSupabase(stay.reservationPath);
          }
        }

        const { reservationFile, ...cleanedStay } = stay as Trip["stays"][number] & { reservationFile?: File | null };
        void reservationFile;
        return {
          ...cleanedStay,
          reservationPath,
          reservationUrl,
        };
      }),
    ),
  };

  const payload = prepareTripForFirestore(tripToSave);

  const propertyDetails: Array<{ path: string; type: string; size: number }> = [];
  let binaryProperty: { path: string; type: string; size: number } | null = null as { path: string; type: string; size: number } | null;

  const describeValue = (value: unknown): { type: string; size: number } => {
    if (value === null) return { type: "null", size: 4 };
    if (value === undefined) return { type: "undefined", size: 0 };
    if (typeof value === "string") return { type: "string", size: new TextEncoder().encode(value).length };
    if (typeof value === "number") return { type: "number", size: String(value).length };
    if (typeof value === "boolean") return { type: "boolean", size: 1 };
    if (Array.isArray(value)) return { type: "array", size: value.length };
    if (typeof value === "object") {
      if (typeof File !== "undefined" && value instanceof File) {
        return { type: "File", size: (value as File).size };
      }
      if (typeof Blob !== "undefined" && value instanceof Blob) {
        return { type: "Blob", size: (value as Blob).size };
      }
      if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
        return { type: "ArrayBuffer", size: (value as ArrayBuffer).byteLength };
      }
      if (typeof Uint8Array !== "undefined" && value instanceof Uint8Array) {
        return { type: "Uint8Array", size: (value as Uint8Array).byteLength };
      }
      return { type: value.constructor?.name ?? "object", size: 0 };
    }
    return { type: typeof value, size: 0 };
  };

  const isBinaryValue = (value: unknown): boolean => {
    if (!value || typeof value !== "object") return false;
    if (typeof File !== "undefined" && value instanceof File) return true;
    if (typeof Blob !== "undefined" && value instanceof Blob) return true;
    if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) return true;
    if (typeof Uint8Array !== "undefined" && value instanceof Uint8Array) return true;
    if (typeof value === "string" && /^data:[^;]+;base64,/.test(value)) return true;
    return false;
  };

  const iterateProperties = (obj: unknown, path = "trip") => {
    if (obj === undefined || obj === null) {
      const desc = describeValue(obj);
      propertyDetails.push({ path, type: desc.type, size: desc.size });
      return;
    }

    if (isBinaryValue(obj)) {
      const desc = describeValue(obj);
      binaryProperty = { path, type: desc.type, size: desc.size };
      propertyDetails.push({ path, type: desc.type, size: desc.size });
      return;
    }

    if (typeof obj !== "object") {
      const desc = describeValue(obj);
      propertyDetails.push({ path, type: desc.type, size: desc.size });
      return;
    }

    if (Array.isArray(obj)) {
      propertyDetails.push({ path, type: "array", size: obj.length });
      obj.forEach((item, index) => iterateProperties(item, `${path}[${index}]`));
      return;
    }

    const entries = Object.entries(obj as Record<string, unknown>);
    propertyDetails.push({ path, type: "object", size: entries.length });
    for (const [key, value] of entries) {
      iterateProperties(value, `${path}.${key}`);
      if (binaryProperty) return;
    }
  };

  iterateProperties(payload);

  propertyDetails.forEach(({ path, type, size }) => {
    console.log(`[SAVE] payload property: ${path} -> ${type} -> ${size} bytes`);
  });

  if (binaryProperty) {
    console.error(`[SAVE] La propiedad ${binaryProperty.path} contiene un objeto binario`);
    throw new Error(`La propiedad ${binaryProperty.path} contiene un objeto binario (${binaryProperty.type}).`);
  }

  const detectUndefinedFields = (
    value: unknown,
    currentPath = "trip",
    parent: unknown = null,
    parentKey: string | null = null,
    results: Array<{ path: string; key: string | null; parent: unknown }> = [],
  ): Array<{ path: string; key: string | null; parent: unknown }> => {
    if (value === undefined) {
      results.push({ path: currentPath, key: parentKey, parent });
      return results;
    }

    if (value === null) {
      return results;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        detectUndefinedFields(item, `${currentPath}[${index}]`, value, String(index), results);
      });
      return results;
    }

    if (typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
        detectUndefinedFields(item, `${currentPath}.${key}`, value, key, results);
      });
    }

    return results;
  };

  const undefinedFields = detectUndefinedFields(payload);
  if (undefinedFields.length > 0) {
    undefinedFields.forEach(({ path, key, parent }) => {
      console.error(`[SAVE] undefined field detected: ${path}`);
      console.error(`[SAVE] field name: ${key}`);
      console.error(`[SAVE] parent object containing undefined field:`, parent);
    });
    throw new Error(
      `[SAVE] Firestore payload contains undefined values. First undefined path: ${undefinedFields[0].path}`,
    );
  }

  const jsonString = JSON.stringify(payload);
  const approxBytes = typeof TextEncoder !== "undefined" ? new TextEncoder().encode(jsonString).length : jsonString.length;

  const MAX_FIRESTORE_DOCUMENT_SIZE = 1000000; // ~1MB Firestore limit per document (approx)
  if (approxBytes > MAX_FIRESTORE_DOCUMENT_SIZE) {
    console.error("[SAVE] Payload too large", { bytes: approxBytes });
    propertyDetails.sort((a, b) => b.size - a.size);
    const top = propertyDetails.slice(0, 20);
    console.error("[SAVE] Top properties by estimated size:", top);
    throw new Error(`Payload too large for Firestore (~${approxBytes} bytes). Top properties: ${JSON.stringify(top)}`);
  }

  if (firebaseEnabled && db) {
    console.log("[SAVE] payload before setDoc", { sizeBytes: approxBytes });
    console.log(payload);
    await setDoc(doc(db, TRIPS_COLLECTION, payload.id), payload);
  }

  const localTrips = readTripsFromLocalStorage();
  const nextTrips = localTrips.filter((item) => item.id !== payload.id).concat(payload);
  writeTripsToLocalStorage(nextTrips);

  return payload;
};
