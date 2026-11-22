# Robyn Graham Property Management CRM

A local-first foundation for a BC property-management practice serving residential, strata, and commercial clients.

## Run it

On a Mac, double-click `Start CRM.command` in this folder. A Terminal window will open and the CRM will open at `http://localhost:3000`.

Alternatively, in Terminal:

```sh
npm start
```

Open `http://localhost:3000`. The first run creates `data/crm.json` with two example leads. All records are persisted locally in that file.

## Shareable link (live on the internet)

**One-click deploy:** [Deploy to Render](https://render.com/deploy?repo=https://github.com/robynagraham11/property-management-crm) → sign in with GitHub → **Apply**.

Full walkthrough: [`docs/SETUP-RENDER.md`](docs/SETUP-RENDER.md)

When deploy is **Live**, your URL looks like `https://property-management-desk.onrender.com`.

**Share these paths on the live URL:**

| Page | Path |
|------|------|
| Desk | `/` |
| Owner intake | `/intake.html` |
| Forms portal | `/portal.html` |
| Owner's Guide PDF | `/guides/landlord-guide.pdf` |

**Important before client data:** The free host has no login yet. Anyone with the URL could see the desk until you add a password or keep the link private. CRM data on Render lives in `data/crm.json` on the server — back it up; free instances can spin down when idle (first load may take ~30 seconds).

Code repo (not the app): https://github.com/robynagraham11/property-management-crm

## What is included

- A lead pipeline: new, contacted, qualified, proposal, appointed, and closed.
- Lead qualification details, follow-up dates, sources, notes, and primary contacts.
- Property records for residential, strata, commercial, or mixed portfolios.
- CRUD API collections for `leads`, `contacts`, `properties`, `units`, `tasks`, `workOrders`, `leases`, and `documents`.
- Dashboard counts and follow-up reminders.

## Forms & documents portal

A branded one-stop hub for BC residential tenancy forms, disclosures and guidance lives at `public/portal.html` (open it at `http://localhost:3000/portal.html` while the server runs, or double-click the file). It links to the editable documents in `public/toolkit/`:

- `00-compliance-foundation.md` — licensing, business licence, trust accounts, insurance
- `01-property-management-agreement.md` — three selectable service models
- `02-tenant-placement-service-agreement.md` — leasing/placement only
- `03-disclosures-and-statutory-forms.md` — official RTB/BCFSA/strata form catalog
- `04-custom-forms-and-addenda.md` — drafted addenda, entry notice, deposit settlement, application
- `05-quick-start-checklist.md` — day-one operating checklist

The toolkit is AI-drafted; have a BC lawyer and your managing broker review the agreements before first use, and always download current official forms from the RTB/BCFSA websites.

## API

Each collection supports:

```text
GET    /api/{collection}
GET    /api/{collection}/{id}
POST   /api/{collection}
PATCH  /api/{collection}/{id}
DELETE /api/{collection}/{id}
```

Send JSON bodies to `POST` and `PATCH` requests. Example:

```sh
curl -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Book owner discovery call","status":"Open","dueDate":"2026-09-30","relatedLeadId":"lead-1"}'
```

## Before using with real clients

This is a working foundation, not a production brokerage platform. Before storing client records or handling funds, add authentication and role controls, encrypted backups, audit logs, a managed database, document storage, privacy/retention policies, and integrations approved by your brokerage. Confirm your actual obligations with BCFSA, the Residential Tenancy Branch, applicable strata legislation, and qualified legal/accounting advisors. Do not use this app for trust accounting.
