// Restricts the app to same-origin resources only, so client-side tools cannot
// exfiltrate data even if a dependency misbehaves. Applied as a <meta> tag at build
// time (renderer build) and as a response header by the app:// protocol handler.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')
