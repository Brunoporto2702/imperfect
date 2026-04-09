async function request<T>(method: string, url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

export function post<T>(url: string, body: unknown): Promise<T> {
  return request<T>("POST", url, body);
}

export function patch<T>(url: string, body: unknown): Promise<T> {
  return request<T>("PATCH", url, body);
}

export function del<T>(url: string, body: unknown): Promise<T> {
  return request<T>("DELETE", url, body);
}
