import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Trip } from "../types/trip";
import ProfessorView from "./ProfessorView";
import { fetchTripById } from "../services/tripService";

export default function TripAccessPage() {
  const { tripId, token } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!tripId || !token) {
        setError("URL de acceso inválida.");
        setLoading(false);
        return;
      }

      const fetched = await fetchTripById(tripId);
      if (!fetched || fetched.accessToken !== token) {
        setError("Acceso no autorizado o viaje no encontrado.");
        setLoading(false);
        return;
      }

      setTrip(fetched);
      setLoading(false);
    };

    load();
  }, [tripId, token]);

  if (loading) {
    return <div className="screen-card section-block"><p>Cargando viaje...</p></div>;
  }

  if (error) {
    return <div className="screen-card section-block"><p>{error}</p></div>;
  }

  return trip ? <ProfessorView trip={trip} /> : <div className="screen-card section-block"><p>Viaje no encontrado.</p></div>;
}
