export async function fetchWithAuth(url, options = {}) {
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token") || "";
  }

  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${token}`
  };

  const response = await fetch(url, { ...options, headers, credentials: 'include' });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login?expired=true";
    }
  }

  return response;
}
