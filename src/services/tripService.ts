import type { Trip } from "../types/trip";
import { db, storage, firebaseEnabled } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

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

const uploadFile = async (path: string, file: File): Promise<string> => {
  if (!storage) return "";
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

const segmentPath = (tripId: string, segmentId: string) =>
  `trips/${tripId}/segments/${segmentId}/ticket.pdf`;

const stayPath = (tripId: string, stayId: string) =>
  `trips/${tripId}/stays/${stayId}/reservation.pdf`;

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
  if (firebaseEnabled && db) {
    await deleteDoc(doc(db, TRIPS_COLLECTION, tripId));
  }

  const localTrips = readTripsFromLocalStorage();
  writeTripsToLocalStorage(localTrips.filter((trip) => trip.id !== tripId));
};

export const persistTrip = async (
  trip: Trip,
  segmentsWithFiles: Array<Trip["segments"][number] & { ticketFile?: File | null }>,
  staysWithFiles: Array<Trip["stays"][number] & { reservationFile?: File | null }>,
): Promise<Trip> => {
  const now = new Date().toISOString();
  const tripToSave: Trip = {
    ...trip,
    accessToken: trip.accessToken ?? crypto.randomUUID(),
    createdAt: trip.createdAt ?? now,
    updatedAt: now,
    segments: await Promise.all(
      segmentsWithFiles.map(async (segment) => {
        const file = segment.ticketFile;
        const ticketUrl =
          firebaseEnabled && file
            ? await uploadFile(segmentPath(trip.id, segment.id), file)
            : segment.ticketUrl ?? "";

        return {
          ...segment,
          ticketUrl,
        };
      }),
    ),
    stays: await Promise.all(
      staysWithFiles.map(async (stay) => {
        const file = stay.reservationFile;
        const reservationUrl =
          firebaseEnabled && file
            ? await uploadFile(stayPath(trip.id, stay.id), file)
            : stay.reservationUrl ?? "";

        return {
          ...stay,
          reservationUrl,
        };
      }),
    ),
  };

  if (firebaseEnabled && db) {
    await setDoc(doc(db, TRIPS_COLLECTION, tripToSave.id), tripToSave);
  }

  const localTrips = readTripsFromLocalStorage();
  const nextTrips = localTrips.filter((item) => item.id !== tripToSave.id).concat(tripToSave);
  writeTripsToLocalStorage(nextTrips);

  return tripToSave;
};
