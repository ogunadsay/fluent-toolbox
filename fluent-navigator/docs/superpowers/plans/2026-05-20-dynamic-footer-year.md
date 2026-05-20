# Dynamic Footer Year Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the copyright year in the root `index.html` footer dynamic so it always reflects the current calendar year.

**Architecture:** Use a target `<span>` with a specific ID in the HTML and a small JavaScript snippet in the global `DOMContentLoaded` listener to inject the current year.

**Tech Stack:** HTML5, Vanilla JavaScript.

---

### Task 1: Update index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Locate and wrap the year in a span**

In `index.html`, find the footer section and wrap the hardcoded year `2025` in a span with `id="current-year"`.

```html
<!-- Before -->
<p>&copy; 2025 Fluent Toolbox</p>

<!-- After -->
<p>&copy; <span id="current-year">2025</span> Fluent Toolbox</p>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add current-year span to footer"
```

### Task 2: Implement Dynamic Year Logic

**Files:**
- Modify: `js/main.js`

- [ ] **Step 1: Add year injection logic**

In `js/main.js`, inside the `DOMContentLoaded` event listener, add the logic to update the `#current-year` element.

```javascript
// Add this inside the DOMContentLoaded listener
const yearElement = document.getElementById('current-year');
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}
```

- [ ] **Step 2: Verify the combined js/main.js content**

Ensure the final `js/main.js` looks like this (contextual placement):

```javascript
document.addEventListener('DOMContentLoaded', () => {
  // Update current year in footer
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Get all cards
  const cards = document.querySelectorAll('.card');
  // ... rest of existing code
});
```

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat: inject current year via JavaScript"
```

### Task 3: Manual Verification

- [ ] **Step 1: Check in browser**

Since we don't have an automated test suite for the UI in this project, manually verify that the year correctly reflects the current year in the footer when `index.html` is loaded.

- [ ] **Step 2: Final Status Check**

Run: `git status`
Expected: Working tree clean.
