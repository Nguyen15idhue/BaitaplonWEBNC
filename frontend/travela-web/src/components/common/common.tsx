export function Loading() {
  return <p>Loading...</p>;
}

export function EmptyState({ message }: { message: string }) {
  return <p>{message}</p>;
}

export function ErrorState({ message }: { message: string }) {
  return <p style={{ color: "red" }}>{message}</p>;
}

export function PageHeader({ title }: { title: string }) {
  return <h1>{title}</h1>;
}
