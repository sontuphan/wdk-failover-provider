/**
 * Generates a simple UID using Math.random().
 *
 * @param {number} len - The desired UID length.
 * @returns {string} A UID string of the specified length.
 */
export function uid (len = 12) {
  if (len < 1 || len > 256) {
    throw new Error('The UID length must be between 1 and 256 characters.')
  }
  let id = ''
  while (id.length < len) {
    id += Math.round(Math.random() * 10)
  }
  return id
}
