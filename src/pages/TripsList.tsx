import type { Trip } from "../types/trip";

interface Props {
  trips: Trip[];
  onDeleteTrip: (tripId: string) => void;
  onCopyLink: (trip: Trip) => void;
}

export default function TripsList({ trips, onDeleteTrip, onCopyLink }: Props) {
  return (
    <div className="screen-card">
      <div className="section-block">
        <div className="section-header">
          <div>
            <span className="section-label">Mis viajes</span>
            <h2 className="section-title">Gestión académica</h2>
          </div>
        </div>

        {trips.length === 0 ? (
          <p className="helper-text">Aún no hay viajes registrados. Comienza creando uno.</p>
        ) : (
          <div className="card-grid">
            {trips.map((trip) => {
              const segments = trip.segments ?? [];
              const stays = trip.stays ?? [];
              const now = new Date();
              const upcomingSegment = segments
                .map((segment) => ({
                  segment,
                  when: new Date(
                    `${segment.departureDate}${segment.departureTime ? `T${segment.departureTime}` : ""}`
                  ),
                }))
                .filter(({ when }) => !Number.isNaN(when.getTime()) && when >= now)
                .sort((a, b) => a.when.getTime() - b.when.getTime())[0]?.segment;
              const upcomingStay = stays
                .map((stay) => ({ stay, when: new Date(stay.checkIn) }))
                .filter(({ when }) => !Number.isNaN(when.getTime()) && when >= now)
                .sort((a, b) => a.when.getTime() - b.when.getTime())[0]?.stay;
              const status = segments.length && stays.length ? "Completo" : "Borrador";
              const destinationLabel = upcomingSegment?.destination || upcomingStay?.city || "Viaje académico";
              return (
                <article
                  key={trip.id}
                  className="card-panel card-panel--trip"
                >
                  <div className="item-header">
                    <div>
                      <h3>{trip.professorName}</h3>
                      <p className="helper-text">{destinationLabel}</p>
                    </div>
                    <span className={`status-chip ${status === "Completo" ? "status-chip--success" : "status-chip--info"}`}>
                      {status}
                    </span>
                  </div>
                  <div className="card-body">
                    <p><strong>Fechas:</strong> {trip.startDate} — {trip.endDate}</p>
                    <p className="helper-text">Profesor: {trip.professorEmail || "Sin correo"}</p>
                    <div className="action-row">
                      <button
                        className="button button--outline button--small"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (window.confirm("¿Desea eliminar este viaje?")) {
                            onDeleteTrip(trip.id);
                          }
                        }}
                      >
                        Eliminar viaje
                      </button>
                      <button
                        className="button button--secondary button--small"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onCopyLink(trip);
                        }}
                      >
                        Copiar enlace profesor
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
