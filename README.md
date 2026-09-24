# Robyn Graham Property Management CRM

A local-first foundation for a BC property-management practice serving residential, strata, and commercial clients.

## Run it

On a Mac, double-click `Start CRM.command` in this folder. A Terminal window will open and the CRM will open at `http://localhost:3000`.

Alternatively, in Terminal:

```sh
npm start
```

Open `http://localhost:3000`. The first run creates `data/crm.json` with two example leads. All records are persisted locally in that file.

## What is included

- A lead pipeline: new, contacted, qualified, proposal, appointed, and closed.
- Lead qualification details, follow-up dates, sources, notes, and primary contacts.
- Property records for residential, strata, commercial, or mixed portfolios.
- CRUD API collections for `leads`, `contacts`, `properties`, `units`, `tasks`, `workOrders`, `leases`, and `documents`.
- Dashboard counts and follow-up reminders.

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
