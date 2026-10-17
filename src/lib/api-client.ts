export async function api<T = Record<string, unknown>>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {...options, headers: {"Content-Type": "application/json", ...options?.headers}, cache: "no-store"});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || result.message || "The request could not be completed.");
  return result as T;
}
