const VERSION_KEY = "imperfect:version";
const CLIENT_VERSION = "1";

export function checkClientVersion(): void {
  const stored = localStorage.getItem(VERSION_KEY);
  if (stored !== CLIENT_VERSION) {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("imperfect:") && k !== VERSION_KEY)
      .forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(VERSION_KEY, CLIENT_VERSION);
  }
}
