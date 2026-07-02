import { DateTime } from "luxon";
import type { Segment, Stay, Trip } from "../types/trip";
import { getDocumentUrl } from "../services/supabase";

export type TripEventStatus = "COMPLETED" | "CURRENT" | "UPCOMING" | "FUTURE" | "INVALID";
export type TripEventType = "flight" | "stay";

export interface TripTimelineEvent {
  id: string;
  type: TripEventType;
  title: string;
  subtitle: string;
  icon: string;
  start: DateTime;
  end: DateTime;
  status: TripEventStatus;
  actionLabel?: string;
  actionUrl?: string;
  displayMeta: string;
  validationMessage?: string;
}

export interface TripTimelineResult {
  currentTime: DateTime;
  currentTimeZone: string;
  events: TripTimelineEvent[];
  nextFlight: TripTimelineEvent | null;
  nextStay: TripTimelineEvent | null;
  isTripComplete: boolean;
  validationMessages: string[];
}

const getCurrentTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const parseEventDate = (
  dateValue: string,
  timeValue: string | undefined,
  zone: string,
): DateTime | null => {
  if (!dateValue) {
    return null;
  }

  const iso = timeValue ? `${dateValue}T${timeValue}` : dateValue;
  const result = DateTime.fromISO(iso, { zone });
  return result.isValid ? result : null;
};

const formatDate = (date: DateTime) =>
  date.setLocale("es").toLocaleString(DateTime.DATE_MED);

const formatTime = (date: DateTime) =>
  date.setLocale("es").toLocaleString(DateTime.TIME_SIMPLE);

const computeStayStatus = (
  start: DateTime,
  end: DateTime,
  currentTime: DateTime,
): TripEventStatus => {
  if (!start.isValid || !end.isValid) {
    return "INVALID";
  }

  if (end <= currentTime) {
    return "COMPLETED";
  }

  if (start <= currentTime && currentTime < end) {
    return "CURRENT";
  }

  return "UPCOMING";
};

const buildFlightEvent = (segment: Segment, zone: string): TripTimelineEvent => {
  const departure = parseEventDate(segment.departureDate, segment.departureTime, zone);
  const arrival = segment.arrivalDate || segment.arrivalTime
    ? parseEventDate(segment.arrivalDate ?? segment.departureDate, segment.arrivalTime, zone)
    : null;
  const fallbackArrival = departure ? departure.plus({ hours: 3 }) : null;
  const end = arrival && arrival.isValid ? arrival : fallbackArrival ?? DateTime.invalid("Invalid arrival");

  const validationMessage = !departure
    ? "Fecha u hora de salida inválida."
    : arrival && arrival.isValid && end < departure
    ? "La llegada debe ser posterior a la salida."
    : undefined;

  const start = departure ?? DateTime.invalid("Invalid departure");
  const displayMeta = departure
    ? `${formatDate(departure)} · ${formatTime(departure)}`
    : "Fecha de salida no disponible";

  const ticketUrl = segment.ticketUrl ?? (segment.ticketPath ? getDocumentUrl(segment.ticketPath) : undefined);

  return {
    id: segment.id,
    type: "flight",
    title: `${segment.origin} → ${segment.destination}`,
    subtitle: `${segment.airline} · ${segment.flightNumber}`,
    icon: "✈️",
    start,
    end,
    status: "FUTURE",
    actionLabel: ticketUrl ? "Ver tiquete" : undefined,
    actionUrl: ticketUrl,
    displayMeta,
    validationMessage,
  };
};

const buildStayEvent = (stay: Stay, zone: string): TripTimelineEvent => {
  const arrival = parseEventDate(stay.checkIn, stay.checkInTime, zone);
  let departure = parseEventDate(stay.checkOut, stay.checkOutTime, zone);

  if (departure && !stay.checkOutTime) {
    departure = departure.endOf("day");
  }

  const end = departure ?? DateTime.invalid("Invalid checkout");

  const validationMessage = !arrival
    ? "Fecha u hora de check-in inválida."
    : !departure
    ? "Fecha u hora de check-out inválida."
    : end <= arrival
    ? "Check-out debe ser posterior al check-in."
    : undefined;

  const displayMeta = arrival && departure
    ? `${formatDate(arrival)} — ${formatDate(departure)}`
    : "Fechas de hotel incompletas";

  const reservationUrl = stay.reservationUrl ?? (stay.reservationPath ? getDocumentUrl(stay.reservationPath) : undefined);

  return {
    id: stay.id,
    type: "stay",
    title: stay.hotelName,
    subtitle: stay.city,
    icon: "🏨",
    start: arrival ?? DateTime.invalid("Invalid check-in"),
    end,
    status: "FUTURE",
    actionLabel: reservationUrl ? "Ver reserva" : undefined,
    actionUrl: reservationUrl,
    displayMeta,
    validationMessage,
  };
};

const sortEvents = (events: TripTimelineEvent[]) =>
  events.slice().sort((a, b) => a.start.valueOf() - b.start.valueOf());

const computeStatus = (
  events: TripTimelineEvent[],
  currentTime: DateTime,
): TripTimelineEvent[] => {
  const sorted = sortEvents(events);
  const annotated = sorted.map((event) => {
    if (event.validationMessage) {
      return { ...event, status: "INVALID" as const };
    }

    if (!event.start.isValid || !event.end.isValid) {
      return { ...event, status: "INVALID" as const, validationMessage: "Evento con fechas no válidas." };
    }

    if (event.type === "stay") {
      return { ...event, status: computeStayStatus(event.start, event.end, currentTime) };
    }

    if (event.end < currentTime) {
      return { ...event, status: "COMPLETED" as const };
    }

    if (event.start <= currentTime && currentTime <= event.end) {
      return { ...event, status: "CURRENT" as const };
    }

    return { ...event, status: "FUTURE" as const };
  });

  const nextIndex = annotated.findIndex((event) => event.status === "FUTURE" || event.status === "UPCOMING");
  return annotated.map((event, index) => {
    if (event.status !== "FUTURE") {
      return event;
    }

    return {
      ...event,
      status: index === nextIndex ? "UPCOMING" as const : "FUTURE" as const,
    };
  });
};

export const buildTripTimeline = (trip: Trip): TripTimelineResult => {
  const currentTimeZone = getCurrentTimeZone();
  const currentTime = DateTime.fromJSDate(new Date(), { zone: currentTimeZone });

  const events = [
    ...trip.segments.map((segment) => buildFlightEvent(segment, currentTimeZone)),
    ...trip.stays.map((stay) => buildStayEvent(stay, currentTimeZone)),
  ];

  const timeline = computeStatus(events, currentTime);
  const validEvents = timeline.filter((event) => event.status !== "INVALID");

  const nextFlight = validEvents.find(
    (event) => event.type === "flight" && event.start > currentTime,
  ) ?? null;

  const currentStay = validEvents.find(
    (event) => event.type === "stay" && event.status === "CURRENT",
  );

  const nextStay =
    currentStay ?? validEvents.find((event) => event.type === "stay" && event.start > currentTime) ?? null;

  const hasValidEvent = validEvents.length > 0;
  const isTripComplete =
    hasValidEvent &&
    !validEvents.some((event) =>
      event.status === "CURRENT" || event.status === "UPCOMING" || event.status === "FUTURE",
    );

  const validationMessages = timeline
    .filter((event) => event.status === "INVALID")
    .map((event) => event.validationMessage ?? "Evento con fechas inválidas.");

  return {
    currentTime,
    currentTimeZone,
    events: timeline,
    nextFlight,
    nextStay,
    isTripComplete,
    validationMessages,
  };
};
