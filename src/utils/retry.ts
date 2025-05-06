// src/utils/retry.ts
/**
 * Retries an async function up to a number of times with delay.
 *
 * @template T
 * @param fn       The async function to execute.
 * @param retries  Total attempts (default 3).
 * @param delay    Delay between retries in ms (default 1000).
 * @returns        The resolved value of fn.
 * @throws         The last encountered error if all retries fail.
 */
export async function retry<T> (
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      // wait before next attempt, if any
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  throw lastError
}
