export async function fetchWithAuth(url, options = {}) {
  const headers = {
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers, credentials: 'include' });

  return response;
}
