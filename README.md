# CashFlow Ledger (CFL)

A tiny, private, installable expense tracker. It runs as an app on your phone, stores every transaction in **your own Google Sheet**, and works offline. No accounts, no ads, no third‑party servers — each person connects their own sheet, so your data is only ever visible to you.

---

## Features

- **Installable app** — add it to your home screen from Chrome; opens full‑screen like a native app, and opens even with no connection (service worker caches the app shell).
- **Your own private sheet** — data lives in a Google Sheet you own. Nobody else's backend ever sees it.
- **Fast logging** — collapsible entry form, "Yesterday" shortcut, auto‑categorisation from the merchant name, and autocomplete from merchants you've used before.
- **Flexible bill splitting** — quick presets (50/50, ⅓, ⅔, others pay all) or a custom "others owe" amount; your share is computed automatically.
- **Search, filter & sort** — search by name/category/notes, filter by This Month / Last Month / custom range, and toggle newest‑ or oldest‑first.
- **At‑a‑glance summary** — total spent, total received, and a "others owe you" line for pending reimbursements.
- **Category donut** — a "Where it went" breakdown that reflects your current filter and search.
- **One‑tap CSV export** — download the currently shown transactions as a spreadsheet‑ready file, entirely in the browser.
- **Offline queue** — entries you add offline are saved locally and pushed to your sheet automatically when you reconnect.

---

## How it works

```
 ┌────────────────────┐        fetch (HTTPS)        ┌──────────────────────────┐
 │  index.html + sw.js │  ───────────────────────▶  │  Apps Script web app      │
 │  (GitHub Pages,     │                             │  (code.gs, doGet/doPost) │
 │   installed on      │  ◀───────────────────────  │                          │
 │   your phone)       │        JSON                 │  reads/writes            │
 └────────────────────┘                             │  your Google Sheet       │
                                                     └──────────────────────────┘
```

The frontend is three static files. It talks to a Google Apps Script "web app" that you deploy against your own spreadsheet. Your web‑app URL is entered once in the app's **Settings** and stored only on your device — it is never committed to this repo.

---

## Setup

You'll do this once. Budget ~10 minutes. Everything is free.

### Part A — Backend (Google Sheet + Apps Script)

1. Create a new Google Sheet at **https://sheets.new**. Name it anything (e.g. *CashFlow Ledger Data*). You don't need to add any columns — the app creates the `Expenses` sheet and headers automatically on first use.
2. In that sheet, open **Extensions → Apps Script**.
3. Delete whatever is in the editor, then paste the entire contents of **`code.gs`** from this repo. Click the **Save** icon.
4. *(Optional but recommended)* Set a private key: change the line `const APP_SECRET = '';` to something like `const APP_SECRET = 'my-secret-key-8231';`. Remember it — you'll enter the same value in the app. See [Privacy & APP_SECRET](#privacy--app_secret).
5. Click **Deploy → New deployment**. Click the gear icon and choose **Web app**. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
6. Click **Deploy**. Google will ask you to authorise: pick your account → **Advanced** → **Go to project (unsafe)** → **Allow**. (It says "unsafe" for all personal scripts; it's your own code accessing your own sheet.)
7. Copy the **Web app URL** — it ends in **`/exec`**. Keep it handy.

> **Whenever you edit `code.gs` later**, you must publish the change: **Deploy → Manage deployments → ✏️ (edit) → Version: New version → Deploy.** The `/exec` URL stays the same.

### Part B — Frontend (GitHub Pages)

1. Put **`index.html`** and **`sw.js`** in the **root** of a GitHub repo (this one). `code.gs` and `README.md` can live here too — they aren't served to the browser.
2. In the repo: **Settings → Pages**. Under **Build and deployment → Source**, choose **Deploy from a branch**, select branch **main** and folder **/ (root)**, then **Save**.
3. Wait ~1 minute. Your app is now live at:
   `https://<your-username>.github.io/<your-repo>/`

### Part C — Connect & install on your phone

1. Open that GitHub Pages URL in **Chrome** on your phone.
2. Tap **⚙︎ Settings** (it opens automatically the first time). Enter:
   - **Your name** — used as the default payer on new transactions.
   - **Apps Script web‑app URL** — the `/exec` URL from Part A.
   - **Secret key** — only if you set `APP_SECRET`; otherwise leave blank.
   - Tap **Save & Connect**.
3. Install it: Chrome **⋮ menu → Install app / Add to Home screen**.
4. Add a transaction. It should appear in your Google Sheet within a second or two.

That's it. Anyone can repeat Parts A + C with their own sheet to get their own private copy.

---

## Privacy & APP_SECRET

Because the web app is deployed with **"Who has access: Anyone"**, anyone who knows your `/exec` URL could otherwise read or write your sheet. `APP_SECRET` closes that: set the same private string in `code.gs` **and** in the app's Settings, and every request must carry it or the backend replies `unauthorized`. Knowing the URL is then no longer enough — the URL is the address, the secret is the key.

What it is and isn't: the secret travels inside each request over HTTPS, and it lives only on your device and in your own script — never in this public repo. That's appropriate protection for a personal tracker. It is not bank‑grade auth (on reads the secret rides in the URL, which can appear in Google's logs; anyone holding your unlocked phone could read it from Settings). Use a key you don't reuse elsewhere.

---

## Updating the app

- **Frontend (`index.html` / `sw.js`)** — push to the repo. The service worker is network‑first, so the next time you open the app online you'll get the new version automatically.
- **Backend (`code.gs`)** — re‑publish via **Manage deployments → New version** (see note in Part A).

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Indicator shows **● Sync error** | Check the URL ends in `/exec`, the secret matches `APP_SECRET`, and deployment access is **Anyone**. |
| Edits to `code.gs` seem ignored | You must publish a **New version** under Manage deployments. |
| Nothing loads the very first time offline | Open the app **online once** so the service worker can cache it. |
| Entry shows an orange bar and doesn't reach the sheet | That's the offline/pending state; it syncs automatically when back online (or check the URL/secret). |
| Dates look off by a day | Already handled server‑side; make sure you're on the latest `code.gs`. |

---

## Files

| File | Where it runs | Purpose |
|---|---|---|
| `index.html` | GitHub Pages / your phone | The entire app UI and logic |
| `sw.js` | GitHub Pages / your phone | Service worker for offline app‑shell caching |
| `code.gs` | Google Apps Script | Backend that reads/writes your Google Sheet |
| `README.md` | — | This file |

---

## Tech

Plain HTML/CSS/JavaScript (no framework, no build step), a Google Apps Script web app, and a Google Sheet as the database. Free on Google's and GitHub's free tiers.
