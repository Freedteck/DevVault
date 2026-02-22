/**
 * Fetch with retry and exponential backoff
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param retries - Number of retries
 * @param backoff - Initial backoff in milliseconds
 * @returns - Fetch response
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = 3,
  backoff: number = 500,
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    // If it's a transient server error (5xx), retry
    if (!response.ok && response.status >= 500 && retries > 0) {
      console.warn(
        `Retrying ${url} due to ${response.status}. Retries left: ${retries}`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(
        `Retrying ${url} due to error: ${error}. Retries left: ${retries}`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}
