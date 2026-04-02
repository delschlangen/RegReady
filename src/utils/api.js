export async function analyzeInput(mode, input) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, input }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.details
      ? `${errorData.error}: ${errorData.details}`
      : errorData.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
