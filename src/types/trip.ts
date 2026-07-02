export interface TravelDocument {
  
  id: string;

  name: string;

  type:
    | "ticket"
    | "hotel"
    | "insurance"
    | "invitation";

  url: string;
}
export interface Segment {
  id: string;

  origin: string;
  destination: string;

  departureDate: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  timezone?: string;

  airline: string;

  flightNumber: string;

  ticketDocumentName?: string;

  ticketUrl?: string;
  ticketPath?: string;
}
export interface Stay {
  id: string;

  city: string;

  hotelName: string;

  checkIn: string;
  checkInTime?: string;

  checkOut: string;
  checkOutTime?: string;

  reservationUrl?: string;
  reservationPath?: string;

  reservationDocumentName?: string;
}
export interface Flight {
  id: string;

  airline: string;
  flightNumber: string;

  origin: string;
  destination: string;

  departureDate: string;
  arrivalDate: string;
}

export interface Hotel {
  id: string;

  name: string;
  address: string;
  phone: string;

  city: string;

  checkIn: string;
  checkOut: string;
}

export interface Trip {
  id: string;

  professorName: string;
  professorEmail: string;

  startDate: string;
  endDate: string;

  coordinatorPhone: string;
  accessToken?: string;

  segments: Segment[];
  stays: Stay[];

  createdAt?: string;
  updatedAt?: string;
}