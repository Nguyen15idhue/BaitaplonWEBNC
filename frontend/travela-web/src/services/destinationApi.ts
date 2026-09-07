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

// Admin (B3): CRUD điểm đến.
export async function createDestination(body: { name: string; regionName: string; description: string }): Promise<Destination> {
  const res = await api.post<Destination>("/destinations", body);
  return res.data;
}

export async function updateDestination(
  id: number,
  body: { name: string; regionName: string; description: string },
): Promise<Destination> {
  const res = await api.put<Destination>(`/destinations/${id}`, body);
  return res.data;
}

export async function deleteDestination(id: number): Promise<void> {
  await api.delete(`/destinations/${id}`);
}
