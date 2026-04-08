# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in GlyphStream, please open an issue or contact the maintainer directly via GitHub.

GlyphStream is a client-side only library with no server-side code, no authentication, and no data collection. The attack surface is minimal — the library only renders ASCII art to the browser.

## Scope

- XSS through crafted input (if any component accepts user-generated text)
- Supply chain vulnerabilities in dependencies
- Any other security-related concerns

## Response Time

We aim to respond to security reports within 48 hours.
