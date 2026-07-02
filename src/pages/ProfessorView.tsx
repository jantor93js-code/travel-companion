import { useMemo } from "react";
import type { Trip } from "../types/trip";
import { buildTripTimeline } from "../utils/tripTimeline";

interface Props {
  trip: Trip;
}

export default function ProfessorView({
  trip,
}: Props) {
  const timeline = useMemo(() => buildTripTimeline(trip), [trip]);
  const nextFlight = timeline.nextFlight;
  const nextStay = timeline.nextStay;

  const statusLabel = timeline.isTripComplete
    ? "Finalizado"
    : timeline.events.some((event) => event.status === "CURRENT")
    ? "Activa"
    : "Planificada";

  const destinationLabel = nextFlight
    ? nextFlight.title.split(" → ").pop() ?? "Viaje académico"
    : nextStay
    ? nextStay.subtitle
    : "Viaje académico";

  const supportUrl = trip.coordinatorPhone ? `https://wa.me/${trip.coordinatorPhone}` : "https://wa.me/573001234567";

  const nextFlightContent = timeline.isTripComplete ? null : nextFlight ? (
    <>
      <div className="boarding-pass-header">
        <div>
          <p className="page-subtitle">{nextFlight.subtitle}</p>
          <h2>{nextFlight.title}</h2>
        </div>
        <span className="boarding-chip">Vuelo</span>
      </div>
      <div className="boarding-pass-body">
        <div className="boarding-location">
          <strong>{nextFlight.title.split(" → ")[0]}</strong>
          <span>{nextFlight.start.toFormat("HH:mm")}</span>
        </div>
        <div className="boarding-divider">↓</div>
        <div className="boarding-location">
          <strong>{nextFlight.title.split(" → ")[1]}</strong>
          <span>{nextFlight.displayMeta}</span>
        </div>
      </div>
      <div className="boarding-pass-footer">
        <div>
          <p className="helper-text">Salida</p>
          <strong>{nextFlight.displayMeta}</strong>
        </div>
        {nextFlight.actionUrl ? (
          <button
            className="button button--secondary button--small"
            type="button"
            onClick={() => window.open(nextFlight.actionUrl, "_blank")}
          >
            {nextFlight.actionLabel}
          </button>
        ) : null}
      </div>
    </>
  ) : (
    <p className="helper-text">No quedan vuelos pendientes.</p>
  );

  const nextStayContent = timeline.isTripComplete ? null : nextStay ? (
    <>
      <div className="hotel-card-header">
        <div>
          <p className="page-subtitle">Hotel</p>
          <h2>{nextStay.title}</h2>
        </div>
        <span className="boarding-chip">Reserva</span>
      </div>
      <div className="hotel-card-body">
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
      </div>
      {nextStay.actionUrl ? (
        <button
          className="button button--secondary button--small"
          type="button"
          onClick={() => window.open(nextStay.actionUrl, "_blank")}
        >
          {nextStay.actionLabel}
        </button>
      ) : null}
    </>
  ) : (
    <p className="helper-text">No quedan reservas pendientes.</p>
  );

  return (
    <div className="screen-card">
      <div className="section-block professor-header">
        <div className="brand-title professor-brand-title">
          <span className="brand-name">Universidad de los Andes</span>
          <strong className="brand-focus">Viajes académicos</strong>
        </div>
        <div className="professor-header-actions">
          <span className="status-chip status-chip--accent">{statusLabel}</span>
          <p className="helper-text helper-text--tight">
            {timeline.currentTime.toFormat("DDDD · HH:mm")} · {timeline.currentTimeZone}
          </p>
        </div>
      </div>

      <div className="section-block professor-hero">
        <div>
          <p className="page-subtitle">Bienvenido, profesor</p>
          <h1 className="page-title">{trip.professorName}</h1>
        </div>
        <div className="professor-summary">
          <div>
            <p className="page-subtitle">Destino activo</p>
            <strong>{destinationLabel}</strong>
          </div>
          <div>
            <p className="page-subtitle">Fechas</p>
            <strong>{trip.startDate} — {trip.endDate}</strong>
          </div>
        </div>
      </div>

      {timeline.isTripComplete ? (
        <div className="section-block">
          <div className="card-panel journey-complete-card">
            <div className="section-label">Viaje finalizado</div>
            <h2>✔ Viaje finalizado</h2>
            <p className="helper-text">Esperamos que haya tenido una excelente experiencia. Para cualquier soporte contacte a la coordinación.</p>
          </div>
        </div>
      ) : (
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
      )}

      <div className="section-block itinerary-section">
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
                    <span className="item-flag">{item.type === "flight" ? "Vuelo" : "Hotel"}</span>
                  </div>
                  <div className="timeline-details">
                    <span>{item.displayMeta}</span>
                  </div>
                  {item.validationMessage && (
                    <p className="helper-text helper-text--error">{item.validationMessage}</p>
                  )}
                  {item.actionLabel && item.actionUrl && (
                    <button
                      className="button button--secondary button--small"
                      type="button"
                      onClick={() => window.open(item.actionUrl, "_blank")}
                    >
                      {item.actionLabel}
                    </button>
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
          <button className="button button--outline" type="button" onClick={() => window.open(supportUrl, "_blank")}>💬 WhatsApp soporte</button>
        </div>
      </div>
    </div>
  );
}
