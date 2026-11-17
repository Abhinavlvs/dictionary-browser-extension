# Security Policy

## Supported versions
Only the latest release receives fixes.

## Reporting a vulnerability
Please report privately through GitHub: **Security tab -> Report a vulnerability** on this repository. Do not open a public issue for security problems. Include the browser and version, steps to reproduce, and the impact you expect.

You can expect an acknowledgement within a few days and a fix or mitigation plan after triage. Please allow reasonable time before public disclosure.

## Scope and design notes
The extension runs a content script on all pages and sends single words you select to a dictionary API. Areas of particular interest: message handling between the content script and background, URL template handling, the shadow-DOM card, and anything that could make the extension send text you did not select with a real user gesture. See `PRIVACY.md` and the "Privacy and security" section of the README for the intended behavior.
