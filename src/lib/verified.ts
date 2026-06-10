/** Usernames with a verified badge. Checked client- and server-side. */
const VERIFIED = new Set(["listenedto"]);

export function isVerified(username: string) {
  return VERIFIED.has(username.toLowerCase());
}
