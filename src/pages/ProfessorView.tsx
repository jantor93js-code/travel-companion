import { useMemo } from "react";
import { DateTime } from "luxon";
import type { Trip } from "../types/trip";
import { buildTripTimeline } from "../utils/tripTimeline";
import InstitutionLogo from "../components/InstitutionLogo";

interface Props {
  trip: Trip;
}

const getRelativeDateLabel = (date: DateTime, currentTime: DateTime) => {
  const days = Math.round(date.startOf("day").diff(currentTime.startOf("day"), "days").days);

  if (days === 0) {
    return "Hoy";
  }
  if (days === 1) {
    return "Mañana";
  }
  if (days === -1) {
    return "Ayer";
  }
  if (days > 1) {
    return `En ${days} días`;
  }
  return `Hace ${Math.abs(days)} días`;
};

const formatDuration = (start: DateTime, end: DateTime) => {
  const diff = end.diff(start, ["hours", "minutes"]).toObject();
  const hours = Math.max(0, Math.floor(diff.hours ?? 0));
  const minutes = Math.max(0, Math.floor(diff.minutes ?? 0));

  if (hours && minutes) {
    return `${hours}h ${minutes}m`;
  }
  if (hours) {
    return `${hours}h`;
  }
  if (minutes) {
    return `${minutes}m`;
  }
  return "--";
};

const formatCountdown = (current: DateTime, target: DateTime) => {
  const diff = target.diff(current, ["days", "hours", "minutes"]).toObject();
  const days = Math.max(0, Math.floor(diff.days ?? 0));
  const hours = Math.max(0, Math.floor(diff.hours ?? 0));
  const minutes = Math.max(0, Math.floor(diff.minutes ?? 0));

  if (days > 1) {
    return `En ${days} días`;
  }
  if (days === 1) {
    return `En 1 día ${hours}h`;
  }
  if (hours > 0) {
    return `En ${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `En ${minutes} min`;
  }
  return "Próximamente";
};

const buildTripSummary = (
  timeline: ReturnType<typeof buildTripTimeline>,
  nextFlight: ReturnType<typeof buildTripTimeline>['nextFlight'],
  currentStay: ReturnType<typeof buildTripTimeline>['nextStay'],
) => {
  if (timeline.isTripComplete) {
    return "Esperamos que tu viaje haya sido exitoso.";
  }

  if (currentStay && currentStay.status === "CURRENT") {
    return `Actualmente te encuentras hospedado en ${currentStay.title}.`;
  }

  if (nextFlight) {
    const dateLabel = getRelativeDateLabel(nextFlight.start, timeline.currentTime).toLowerCase();
    return `Tu próximo vuelo sale ${dateLabel} a las ${nextFlight.start.toFormat("HH:mm")}.`;
  }

  const nextEvent = timeline.events.find((event) => event.status === "UPCOMING" || event.status === "FUTURE");
  if (nextEvent) {
    const days = Math.round(nextEvent.start.startOf("day").diff(timeline.currentTime.startOf("day"), "days").days);
    if (days > 0) {
      return `Tu viaje comienza en ${days} días.`;
    }
  }

  return "Mantén todo listo para tu próximo itinerario.";
};

export default function ProfessorView({
  trip,
}: Props) {
  const timeline = useMemo(() => buildTripTimeline(trip), [trip]);
  const nextFlight = timeline.nextFlight;
  const nextStay = timeline.nextStay;

  const completedEvents = timeline.events.filter((event) => event.status === "COMPLETED").length;
  const totalEvents = timeline.events.length;
  const progressPercent = totalEvents ? Math.round((completedEvents / totalEvents) * 100) : 0;
  const currentStay = timeline.events.find((event) => event.type === "stay" && event.status === "CURRENT") ?? null;

  const statusLabel = timeline.isTripComplete
    ? "Finalizado"
    : timeline.events.some((event) => event.status === "CURRENT")
    ? "Activa"
    : "Planificada";

  const statusChipClass = timeline.isTripComplete
    ? "status-chip--completed"
    : timeline.events.some((event) => event.status === "CURRENT")
    ? "status-chip--current"
    : "status-chip--planned";

  const destinationLabel = nextFlight
    ? nextFlight.title.split(" → ").pop() ?? "Viaje académico"
    : nextStay
    ? nextStay.subtitle
    : "Viaje académico";

  const supportUrl = trip.coordinatorPhone ? `https://wa.me/${trip.coordinatorPhone}` : "https://wa.me/573001234567";
  const smartSummary = buildTripSummary(timeline, nextFlight, currentStay);

  const flightElapsed = nextFlight && nextFlight.start.isValid && nextFlight.end.isValid
    ? formatDuration(nextFlight.start, nextFlight.end)
    : "--";

  const flightCountdown = nextFlight && nextFlight.start > timeline.currentTime
    ? formatCountdown(timeline.currentTime, nextFlight.start)
    : "Vuelo completado";

  const stayNights = nextStay && nextStay.start.isValid && nextStay.end.isValid
    ? Math.max(1, Math.round(nextStay.end.diff(nextStay.start, "days").days))
    : 0;

  const stayState = nextStay
    ? nextStay.status === "CURRENT"
      ? "En curso"
      : nextStay.status === "UPCOMING"
      ? "Pendiente"
      : "Finalizada"
    : "Sin reserva";

  const nextFlightContent = timeline.isTripComplete ? (
    <div className="helper-text">No hay vuelos activos. Revisa el historial de tu itinerario.</div>
  ) : nextFlight ? (
    <>
      <div className="boarding-pass-card-top">
        <div>
          <p className="page-subtitle">{nextFlight.subtitle}</p>
          <h2>{nextFlight.title}</h2>
        </div>
        <span className="boarding-chip boarding-chip--flight">Próximo vuelo</span>
      </div>
      <div className="boarding-pass-route">
        <div>
          <span className="boarding-label">Origen</span>
          <strong>{nextFlight.title.split(" → ")[0]}</strong>
          <span className="boarding-time">{nextFlight.start.toFormat("HH:mm")}</span>
        </div>
        <div className="boarding-divider" aria-hidden="true" />
        <div>
          <span className="boarding-label">Destino</span>
          <strong>{nextFlight.title.split(" → ")[1]}</strong>
          <span className="boarding-time">{nextFlight.end.toFormat("HH:mm")}</span>
        </div>
      </div>
      <div className="boarding-pass-details">
        <div>
          <p className="helper-text">Fecha</p>
          <strong>{nextFlight.start.toFormat("DDDD")}</strong>
        </div>
        <div>
          <p className="helper-text">Duración</p>
          <strong>{flightElapsed}</strong>
        </div>
        <div>
          <p className="helper-text">Estado</p>
          <strong>{flightCountdown}</strong>
        </div>
      </div>
      {nextFlight.actionUrl ? (
        <div className="card-action-row">
          <button
            className="button button--ghost button--small"
            type="button"
            onClick={() => window.open(nextFlight.actionUrl, "_blank")}
          >
            📄 Ver tiquete PDF
          </button>
        </div>
      ) : null}
    </>
  ) : (
    <p className="helper-text">No quedan vuelos pendientes.</p>
  );

  const nextStayContent = timeline.isTripComplete ? (
    <div className="helper-text">No hay reservas activas. Revisa el cierre de tu itinerario.</div>
  ) : nextStay ? (
    <>
      <div className="hotel-card-top">
        <div>
          <p className="page-subtitle">Hotel</p>
          <h2>{nextStay.title}</h2>
        </div>
        <span className="boarding-chip boarding-chip--hotel">Reserva</span>
      </div>
      <div className="hotel-card-body hotel-card-body--grid">
        <div>
          <p className="helper-text">Ciudad</p>
          <strong>{nextStay.subtitle}</strong>
        </div>
        <div>
          <p className="helper-text">Check-in</p>
          <strong>{nextStay.start.toFormat("DDDD")}</strong>
        </div>
        <div>
          <p className="helper-text">Check-out</p>
          <strong>{nextStay.end.toFormat("DDDD")}</strong>
        </div>
        <div>
          <p className="helper-text">Noches</p>
          <strong>{stayNights}</strong>
        </div>
      </div>
      <div className="hotel-card-status-row">
        <span className={`status-pill status-pill--${nextStay.status.toLowerCase()}`}>
          {stayState}
        </span>
        {nextStay.status === "CURRENT" ? <span className="hotel-badge">Hospedado actualmente</span> : null}
      </div>
      {nextStay.actionUrl ? (
        <div className="card-action-row">
          <button
            className="button button--ghost button--small"
            type="button"
            onClick={() => window.open(nextStay.actionUrl, "_blank")}
          >
            📄 Ver reserva PDF
          </button>
        </div>
      ) : null}
    </>
  ) : (
    <p className="helper-text">No quedan reservas pendientes.</p>
  );

  return (
    <div className="screen-card">
      <div className="section-block hero-panel">
        <div className="hero-meta">
          <div className="hero-brand">
            <InstitutionLogo />
            <div>
              <span className="brand-name">Viajes académicos</span>
              <h1 className="hero-title">{trip.professorName}</h1>
            </div>
          </div>
          <div className="hero-status">
            <span className={`status-chip ${statusChipClass}`}>{statusLabel}</span>
            <p className="helper-text helper-text--tight">
              {timeline.currentTime.toFormat("DDDD · HH:mm")} · {timeline.currentTimeZone}
            </p>
          </div>
        </div>
        <div className="hero-details">
          <div>
            <p className="page-subtitle">Destino principal</p>
            <strong>{destinationLabel}</strong>
          </div>
          <div>
            <p className="page-subtitle">Fechas del viaje</p>
            <strong>{trip.startDate} — {trip.endDate}</strong>
          </div>
        </div>
      </div>

      <div className="section-block summary-panel">
        <p className="section-label">Resumen inteligente</p>
        <div className="summary-copy">
          {smartSummary}
        </div>
      </div>

      <div className="section-block premium-grid">
        <div className="card-panel boarding-pass-card">
          <div className="section-label">Próximo vuelo</div>
          {nextFlightContent}
        </div>
        <div className="card-panel hotel-card">
          <div className="section-label">Próxima reserva</div>
          {nextStayContent}
        </div>
      </div>

      <div className="section-block itinerary-section">
        <div className="timeline-header">
          <div>
            <p className="section-label">Avance del itinerario</p>
            <strong>{completedEvents} / {totalEvents} eventos completados</strong>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="section-title">Itinerario completo</div>
        <div className="timeline timeline--rich">
          {timeline.events.length === 0 ? (
            <p className="helper-text">No hay elementos en el itinerario todavía.</p>
          ) : (
            timeline.events.map((item) => (
              <div key={item.id} className={`timeline-item timeline-item--${item.status.toLowerCase()}`}>
                <div className="timeline-marker">{item.icon}</div>
                <div className="timeline-content">
                  <div className="timeline-headline">
                    <div>
                      <div className="item-title">{item.title}</div>
                      <p className="item-meta">{item.subtitle}</p>
                    </div>
                    <div className="timeline-labels">
                      <span className={`item-flag item-flag--${item.type}`}>{item.type === "flight" ? "Vuelo" : "Hotel"}</span>
                      <span className="context-label">{getRelativeDateLabel(item.start, timeline.currentTime)}</span>
                    </div>
                  </div>
                  <div className="timeline-details">
                    <span>{item.displayMeta}</span>
                  </div>
                  {item.validationMessage && (
                    <p className="helper-text helper-text--error">{item.validationMessage}</p>
                  )}
                  {item.actionLabel && item.actionUrl && (
                    <div className="timeline-action-row">
                      <button
                        className="button button--ghost button--small"
                        type="button"
                        onClick={() => window.open(item.actionUrl, "_blank")}
                      >
                        📄 {item.actionLabel}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="section-block">
        <div className="section-title">Acciones</div>
        <div className="action-row">
          <button className="button button--support button--small" type="button" onClick={() => window.open(supportUrl, "_blank")}>💬 WhatsApp soporte</button>
        </div>
      </div>
    </div>
  );
}
