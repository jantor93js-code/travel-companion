import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Trip } from "../types/trip";
import TripsList from "./TripsList";
import { fetchTrips, deleteTripById } from "../services/tripService";
import logo from "../assets/uniandes-logo (2).png";

export default function AdminPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadTrips = async () => {
    setLoading(true);
    try {
      const data = await fetchTrips();
      setTrips(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadTrips();
    };

    load();
  }, []);

  const handleDeleteTrip = async (tripId: string) => {
    await deleteTripById(tripId);
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
  };

  const handleCopyLink = async (trip: Trip) => {
    if (!trip.accessToken) {
      window.alert("El viaje aún no tiene enlace de acceso. Guarda el viaje primero.");
      return;
    }

    const shareUrl = `${window.location.origin}/trip/${trip.id}/access/${trip.accessToken}`;
    await navigator.clipboard.writeText(shareUrl);
    window.alert("Enlace de profesor copiado al portapapeles.");
  };

  return (
    <div className="screen-card admin-shell-card">
      <div className="section-block section-block--spacious">
        <div className="page-header page-header--brand">
          <div className="brand-plate brand-plate--header">
            <img src={logo} alt="Universidad de los Andes" className="brand-logo brand-logo--large" />
            <div className="brand-title">
              <span className="brand-name">Administración</span>
              <strong className="brand-focus">Viajes académicos</strong>
            </div>
          </div>
          <button className="button button--primary" type="button" onClick={() => navigate("/admin/new")}>+ Nuevo viaje</button>
        </div>
        <div className="section-intro">
          <span className="section-label">ADMINISTRACIÓN</span>
          <h1 className="page-title">Administración de viajes</h1>
          <p className="helper-text">Crea viajes y comparte el enlace de acceso con el profesor.</p>
        </div>

        {loading ? (
          <p className="helper-text">Cargando viajes...</p>
        ) : (
          <TripsList
            trips={trips}
            onDeleteTrip={handleDeleteTrip}
            onCopyLink={handleCopyLink}
          />
        )}
      </div>
    </div>
  );
}
