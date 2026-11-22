# Deploy the Property Desk on Render (about 5 minutes)

Render runs your desk on the internet so you get a URL like `https://property-management-desk.onrender.com`.

## One-click start

1. Open: **https://render.com/deploy?repo=https://github.com/robynagraham11/property-management-crm**
2. Click **Sign in with GitHub** (use **robynagraham11**).
3. Approve Render to read the **property-management-crm** repo.
4. Render reads **`render.yaml`** and proposes a service named **property-management-desk**.
5. Click **Apply** or **Create**.
6. Wait until status is **Live** (first build ~3–5 minutes).

Your live desk URL appears at the top of the service page.

## After deploy — bookmark these

| Page | Path |
|------|------|
| Desk (CRM) | `/` |
| Owner intake (light) | `/intake.html` |
| Forms portal | `/portal.html` |
| Owner’s Guide | `/guides/landlord-guide.pdf` |

## WordPress webhook (optional)

In Fluent Forms, set webhook URL to:

`https://YOUR-RENDER-URL.onrender.com/api/intake`

See `toolkit/wordpress-integration.md`.

## Free tier notes

- First visit after idle can take **~30 seconds** while the service wakes up.
- Data is stored in `data/crm.json` on the server — **export or back up** before big changes.
- There is **no login** on the desk yet — keep the URL private until you add auth.

## Redeploy after code changes

Merge to **main** on GitHub. If auto-deploy is on (default), Render rebuilds automatically.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on Playwright | Use latest **main** (Playwright removed from production `package.json`). |
| 404 on `/branding/` | Pull latest **server.js** (directory `index.html` fix). |
| Empty leads after redeploy | Free tier may reset disk on some redeploys — keep local `data/crm.json` backup on your Mac. |