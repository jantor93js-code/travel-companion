import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Trip } from "../types/trip";
import { persistTrip } from "../services/tripService";
import InstitutionLogo from "../components/InstitutionLogo";

interface Props {
  onSave?: (trip: Trip) => void;
}

export default function AdminForm({ onSave }: Props) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [airline, setAirline] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [segments, setSegments] = useState<Trip["segments"]>([]);
  const [segmentTicket, setSegmentTicket] = useState<File | null>(null);
  const [segmentTicketName, setSegmentTicketName] = useState("");
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

  const [hotelCity, setHotelCity] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [reservationFile, setReservationFile] = useState<File | null>(null);
  const [reservationFileName, setReservationFileName] = useState("");
  const [editingStayId, setEditingStayId] = useState<string | null>(null);
  const [stays, setStays] = useState<Trip["stays"]>([]);

  const [trip, setTrip] = useState<Trip>({
    id: crypto.randomUUID(),
    professorName: "",
    professorEmail: "",
    startDate: "",
    endDate: "",
    coordinatorPhone: "",
    segments: [],
    stays: [],
  });

  const navigate = useNavigate();

  const resetSegmentForm = () => {
    setOrigin("");
    setDestination("");
    setDepartureDate("");
    setDepartureTime("");
    setArrivalDate("");
    setArrivalTime("");
    setAirline("");
    setFlightNumber("");
    setSegmentTicket(null);
    setSegmentTicketName("");
    setEditingSegmentId(null);
  };

  const resetStayForm = () => {
    setHotelCity("");
    setHotelName("");
    setCheckInDate("");
    setCheckInTime("");
    setCheckOutDate("");
    setCheckOutTime("");
    setReservationFile(null);
    setReservationFileName("");
    setEditingStayId(null);
  };

  const validateSegment = () => {
    return (
      origin.trim() &&
      destination.trim() &&
      departureDate &&
      departureTime &&
      arrivalDate &&
      arrivalTime &&
      airline.trim() &&
      flightNumber.trim()
    );
  };

  const validateStay = () => {
    return (
      hotelCity.trim() &&
      hotelName.trim() &&
      checkInDate &&
      checkInTime &&
      checkOutDate &&
      checkOutTime
    );
  };

  const handleAddOrUpdateSegment = () => {
    if (!validateSegment()) {
      window.alert("Complete todos los campos del trayecto.");
      return;
    }

    const existingSegment = segments.find((item) => item.id === editingSegmentId);
    const nextSegment = {
      id: editingSegmentId ?? crypto.randomUUID(),
      origin,
      destination,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      airline,
      flightNumber,
      ...(segmentTicketName || segmentTicket?.name
        ? { ticketDocumentName: segmentTicketName || segmentTicket?.name }
        : {}),
      ticketUrl: segmentTicket
        ? URL.createObjectURL(segmentTicket)
        : existingSegment?.ticketUrl ?? "",
      ticketFile: segmentTicket ?? undefined,
      ...(existingSegment?.ticketPath !== undefined
        ? { ticketPath: existingSegment.ticketPath }
        : {}),
    } as Trip["segments"][number] & { ticketFile?: File | null };

    setSegments((prev) => {
      if (editingSegmentId) {
        return prev.map((item) => (item.id === editingSegmentId ? nextSegment : item));
      }
      return [...prev, nextSegment];
    });

    resetSegmentForm();
  };

  const handleEditSegment = (segment: Trip["segments"][number]) => {
    setOrigin(segment.origin);
    setDestination(segment.destination);
    setDepartureDate(segment.departureDate);
    setDepartureTime(segment.departureTime ?? "");
    setArrivalDate(segment.arrivalDate ?? "");
    setArrivalTime(segment.arrivalTime ?? "");
    setAirline(segment.airline);
    setFlightNumber(segment.flightNumber);
    setSegmentTicketName(segment.ticketDocumentName ?? "");
    setSegmentTicket(null);
    setEditingSegmentId(segment.id);
  };

  const handleDeleteSegment = (segmentId: string) => {
    if (!window.confirm("¿Desea eliminar este trayecto?")) return;
    setSegments((prev) => prev.filter((segment) => segment.id !== segmentId));
    if (editingSegmentId === segmentId) {
      resetSegmentForm();
    }
  };

  const handleAddOrUpdateStay = () => {
    if (!validateStay()) {
      window.alert("Complete todos los campos de la estancia.");
      return;
    }

    const existingStay = stays.find((item) => item.id === editingStayId);
    const nextStay = {
      id: editingStayId ?? crypto.randomUUID(),
      city: hotelCity,
      hotelName,
      checkIn: checkInDate,
      checkInTime,
      checkOut: checkOutDate,
      checkOutTime,
      ...(reservationFileName || reservationFile?.name
        ? { reservationDocumentName: reservationFileName || reservationFile?.name }
        : {}),
      reservationUrl: reservationFile
        ? URL.createObjectURL(reservationFile)
        : existingStay?.reservationUrl ?? "",
      reservationFile: reservationFile ?? undefined,
      ...(existingStay?.reservationPath !== undefined
        ? { reservationPath: existingStay.reservationPath }
        : {}),
    } as Trip["stays"][number] & { reservationFile?: File | null };

    setStays((prev) => {
      if (editingStayId) {
        return prev.map((item) => (item.id === editingStayId ? nextStay : item));
      }
      return [...prev, nextStay];
    });

    resetStayForm();
  };

  const handleEditStay = (stay: Trip["stays"][number]) => {
    setHotelCity(stay.city);
    setHotelName(stay.hotelName);
    setCheckInDate(stay.checkIn);
    setCheckInTime(stay.checkInTime ?? "");
    setCheckOutDate(stay.checkOut);
    setCheckOutTime(stay.checkOutTime ?? "");
    setReservationFileName(stay.reservationDocumentName ?? "");
    setReservationFile(null);
    setEditingStayId(stay.id);
  };

  const handleDeleteStay = (stayId: string) => {
    if (!window.confirm("¿Desea eliminar esta estancia?")) return;
    setStays((prev) => prev.filter((stay) => stay.id !== stayId));
    if (editingStayId === stayId) {
      resetStayForm();
    }
  };

  const handleSaveTrip = async () => {
    try {
      const saved = await persistTrip(
        { ...trip, segments, stays },
        segments,
        stays,
      );

      if (onSave) {
        onSave(saved);
      }
      navigate("/admin");
    } catch (error) {
      console.error("[SAVE] Error en handleSaveTrip", error);
      window.alert(
        error instanceof Error
          ? `No se pudo guardar el viaje: ${error.message}`
          : "No se pudo guardar el viaje. Revisa la consola para más detalles.",
      );
    }
  };

  return (
    <div className="screen-card admin-form-card">
      <div className="section-block admin-header-block">
        <div>
          <p className="page-subtitle">Panel administrativo</p>
          <h1 className="page-title">Coordinadora de viajes</h1>
        </div>
        <InstitutionLogo />
      </div>

      <div className="section-block admin-section">
        <div className="section-header">
          <span>👨</span>
          <div>
            <h2>Profesor</h2>
            <p>Datos del docente y soporte para el viaje.</p>
          </div>
        </div>

        <div className="form-card admin-block">
          <div className="form-grid admin-grid-2">
            <div className="form-field">
              <label>Nombre del profesor</label>
              <input
                className="input-field"
                placeholder="Nombre completo"
                value={trip.professorName}
                onChange={(e) => setTrip((prev) => ({ ...prev, professorName: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Correo del profesor</label>
              <input
                className="input-field"
                placeholder="Correo electrónico"
                value={trip.professorEmail}
                onChange={(e) => setTrip((prev) => ({ ...prev, professorEmail: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>WhatsApp de soporte</label>
              <input
                className="input-field"
                placeholder="573XXXXXXXXX"
                value={trip.coordinatorPhone}
                onChange={(e) => setTrip((prev) => ({ ...prev, coordinatorPhone: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Fecha de inicio</label>
              <input
                className="input-field"
                type="date"
                value={trip.startDate}
                onChange={(e) => setTrip((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Fecha de fin</label>
              <input
                className="input-field"
                type="date"
                value={trip.endDate}
                onChange={(e) => setTrip((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="section-block admin-section">
        <div className="section-header">
          <span>✈</span>
          <div>
            <h2>Trayectos</h2>
            <p>Agrega vuelos con horarios completos y certificados.</p>
          </div>
        </div>

        <div className="form-card admin-block">
          <div className="form-grid admin-grid-4">
            <div className="form-field">
              <label>Origen</label>
              <input
                className="input-field"
                placeholder="Ej. Bogotá"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Destino</label>
              <input
                className="input-field"
                placeholder="Ej. São Paulo"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Aerolínea</label>
              <input
                className="input-field"
                placeholder="Ej. LATAM"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Número de vuelo</label>
              <input
                className="input-field"
                placeholder="Ej. LA8010"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Fecha salida</label>
              <input
                className="input-field"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Hora salida</label>
              <input
                className="input-field"
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Fecha llegada</label>
              <input
                className="input-field"
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Hora llegada</label>
              <input
                className="input-field"
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
              />
            </div>
            <div className="form-field file-field">
              <label>PDF tiquete</label>
              <input
                className="input-field"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSegmentTicket(file);
                  setSegmentTicketName(file?.name || "");
                }}
              />
            </div>
          </div>

          <div className="action-row">
            <button className="button button--secondary" type="button" onClick={handleAddOrUpdateSegment}>
              {editingSegmentId ? "Actualizar trayecto" : "+ Agregar trayecto"}
            </button>
            {editingSegmentId && (
              <button className="button button--outline" type="button" onClick={resetSegmentForm}>
                Cancelar edición
              </button>
            )}
          </div>
        </div>

        <div className="section-cards">
          {segments.length === 0 ? (
            <p className="helper-text">Aún no hay trayectos agregados.</p>
          ) : (
            segments.map((segment) => (
              <div key={segment.id} className="segment-card">
                <div className="card-top">
                  <div>
                    <p className="page-subtitle">{segment.airline}</p>
                    <h3>{segment.origin} → {segment.destination}</h3>
                  </div>
                  <span className="item-flag">Vuelo</span>
                </div>
                <div className="segment-body">
                  <div>
                    <strong>Salida</strong>
                    <p>{segment.departureDate} · {segment.departureTime ?? "--:--"}</p>
                  </div>
                  <div className="segment-divider">↓</div>
                  <div>
                    <strong>Llegada</strong>
                    <p>{segment.arrivalDate ?? ""} · {segment.arrivalTime ?? "--:--"}</p>
                  </div>
                </div>
                <div className="card-footer">
                  <span>{segment.flightNumber}</span>
                  <div className="card-actions">
                    <button className="button button--outline button--small" type="button" onClick={() => handleEditSegment(segment)}>
                      Editar
                    </button>
                    <button className="button button--secondary button--small" type="button" onClick={() => handleDeleteSegment(segment.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="section-block admin-section">
        <div className="section-header">
          <span>🏨</span>
          <div>
            <h2>Estancias</h2>
            <p>Agrega reservas de hotel con check-in y check-out completos.</p>
          </div>
        </div>

        <div className="form-card admin-block">
          <div className="form-grid admin-grid-4">
            <div className="form-field">
              <label>Ciudad</label>
              <input
                className="input-field"
                placeholder="Ej. São Paulo"
                value={hotelCity}
                onChange={(e) => setHotelCity(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Hotel</label>
              <input
                className="input-field"
                placeholder="Ej. Intercontinental"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Check-in fecha</label>
              <input
                className="input-field"
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Check-in hora</label>
              <input
                className="input-field"
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Check-out fecha</label>
              <input
                className="input-field"
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Check-out hora</label>
              <input
                className="input-field"
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
            </div>
            <div className="form-field file-field">
              <label>PDF reserva</label>
              <input
                className="input-field"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setReservationFile(file);
                  setReservationFileName(file?.name || "");
                }}
              />
            </div>
          </div>

          <div className="action-row">
            <button className="button button--secondary" type="button" onClick={handleAddOrUpdateStay}>
              {editingStayId ? "Actualizar estancia" : "+ Agregar estancia"}
            </button>
            {editingStayId && (
              <button className="button button--outline" type="button" onClick={resetStayForm}>
                Cancelar edición
              </button>
            )}
          </div>
        </div>

        <div className="section-cards">
          {stays.length === 0 ? (
            <p className="helper-text">Aún no hay estancias agregadas.</p>
          ) : (
            stays.map((stay) => (
              <div key={stay.id} className="stay-card">
                <div className="card-top">
                  <div>
                    <p className="page-subtitle">{stay.hotelName}</p>
                    <h3>{stay.city}</h3>
                  </div>
                  <span className="item-flag">Estancia</span>
                </div>
                <div className="stay-body">
                  <div>
                    <strong>Check-in</strong>
                    <p>{stay.checkIn} · {stay.checkInTime ?? "--:--"}</p>
                  </div>
                  <div className="stay-divider">↓</div>
                  <div>
                    <strong>Check-out</strong>
                    <p>{stay.checkOut} · {stay.checkOutTime ?? "--:--"}</p>
                  </div>
                </div>
                <div className="card-actions">
                  <button className="button button--outline button--small" type="button" onClick={() => handleEditStay(stay)}>
                    Editar
                  </button>
                  <button className="button button--secondary button--small" type="button" onClick={() => handleDeleteStay(stay.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="section-block admin-section admin-summary">
        <div className="section-header">
          <span>💾</span>
          <div>
            <h2>Guardar viaje</h2>
            <p>Revisa y almacena la información del viaje.</p>
          </div>
        </div>

        <div className="form-card summary-card">
          <div className="summary-grid">
            <div>
              <p className="page-subtitle">Profesor</p>
              <strong>{trip.professorName || "No definido"}</strong>
              <p className="helper-text">{trip.professorEmail || "Sin correo"}</p>
            </div>
            <div>
              <p className="page-subtitle">Trayectos</p>
              <strong>{segments.length}</strong>
            </div>
            <div>
              <p className="page-subtitle">Estancias</p>
              <strong>{stays.length}</strong>
            </div>
          </div>
          <div className="action-row">
            <button className="button button--primary" type="button" onClick={handleSaveTrip}>
              Guardar viaje
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
