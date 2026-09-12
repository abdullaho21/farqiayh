/** Only deployment-owned configuration determines the trusted application origin. */
export function appOrigin() {
  const configured = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL;
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("Set APP_URL to the public HTTPS URL for this deployment.");
  }
  const url = new URL(configured || "http://localhost:3000");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error(
      "APP_URL must be an HTTP or HTTPS URL without credentials.",
    );
  }
  return url.origin;
}
