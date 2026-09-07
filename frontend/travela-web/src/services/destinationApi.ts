import { api } from "./api";
import type { Destination } from "../types";

// Destination thật (B3 xong): public đọc.
export async function listDestinations(search?: string): Promise<Destination[]> {
  const res = await api.get<Destination[]>("/destinations", {
    params: search ? { search } : {},
  });
  return res.data;
}

export async function getDestination(id: number): Promise<Destination> {
  const res = await api.get<Destination>(`/destinations/${id}`);
  return res.data;
}
