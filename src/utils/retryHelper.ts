export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 200;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// Simple rate limiter for Lemmy requests
const requestTimestamps: Map<string, number> = new Map();
const MIN_INTERVAL_MS = 300; // min ms between requests to same instance

export async function rateLimitedRequest<T>(
  instance: string,
  fn: () => Promise<T>
): Promise<T> {
  const lastTime = requestTimestamps.get(instance) || 0;
  const now = Date.now();
  const elapsed = now - lastTime;

  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }

  requestTimestamps.set(instance, Date.now());
  return withExponentialBackoff(fn);
}
