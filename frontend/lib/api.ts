// Centralized API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function getAuthJsonHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", ...getAuthHeaders() };
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    ...getAuthHeaders(),
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("auth-expired"));
      }
    }
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = "An error occurred";
    if (typeof errorData.detail === "string") {
      errorMessage = errorData.detail;
    } else if (Array.isArray(errorData.detail)) {
      errorMessage = errorData.detail.map((e: any) => e.msg).join(", ");
    } else if (errorData.message) {
      errorMessage = errorData.message;
    } else {
      errorMessage = `API error: ${response.status}`;
    }
    
    // Show global toast
    if (typeof window !== "undefined") {
      import("sonner").then(({ toast }) => {
        toast.error(errorMessage);
      });
    }
    
    throw new Error(errorMessage);
  }
  
  // Return response directly for downloads
  if (options.headers && (options.headers as any)["Accept"] === "application/octet-stream") {
    return response;
  }
  
  return response.json();
}
