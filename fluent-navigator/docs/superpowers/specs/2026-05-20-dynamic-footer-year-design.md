# Design Spec - Dynamic Footer Year

## Overview
Make the copyright year in the root `index.html` footer dynamic so it always reflects the current calendar year.

## Proposed Changes

### HTML (`index.html`)
- Locate the footer copyright paragraph.
- Wrap the year `2025` in a `<span>` tag with `id="current-year"`.

### JavaScript (`js/main.js`)
- Add logic inside the `DOMContentLoaded` listener to:
    1. Select the `#current-year` element.
    2. If found, update its `textContent` with the value of `new Date().getFullYear()`.

## Verification Plan
- **Manual Verification:** Open `index.html` in a browser and verify that the year matches the current year.
- **Automated Verification:** None required for this small UI enhancement, but manual check is sufficient.
