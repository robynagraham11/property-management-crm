# WordPress + Property Desk — how it fits together

Your public site **robyngraham.ca** holds the branded owner forms. The **Property Desk** (local or Render) is your working CRM. They can work side by side without duplicating work.

## Live form URLs (Fluent Forms)

| Page | URL | Fluent Form | Use |
|------|-----|-------------|-----|
| **Owner intake** (full management onboarding) | https://robyngraham.ca/owner-intake-rwr | Form **#4** | After verbal yes — deposits, insurance, utilities, strata, repair limits |
| **Placement intake** (lease-up only) | https://robyngraham.ca/placement-intake-rwr | Form **#5** | Shorter — showing access, lease prefs, who signs/holds deposit |

Both pages are **password-protected in WordPress** today. Submissions land in **WP Admin → Fluent Forms → Entries** (Form 4 or 5).

**Security:** If you shared the page password in email or chat, change it in WordPress: edit each page → **Visibility → Password protected**.

## What WordPress does best

- Your theme, Stonehaus lockup, and copy owners already trust  
- Email notifications from Fluent Forms  
- No server to maintain for the form itself  

## What the desk does best

- Owner **leads** pipeline and follow-up dates  
- **Applicant screening** (consent before checks)  
- **Placement file** checklist (BCFSA + RTB steps)  
- **Forms library** (official PDFs + toolkit Word files)  

## Optional: send Fluent Forms into the desk

After you deploy the desk to Render (or keep it on your Mac when you’re working):

1. In WordPress: **Fluent Forms → Settings → Integrations → Webhooks** (or per-form **Settings → Webhooks**).
2. **Webhook URL:** `https://YOUR-RENDER-URL.onrender.com/api/intake`
3. **Method:** POST · **Format:** JSON  
4. Map at minimum: name, email, phone, rental property address → or send the **full entry** and let the desk store the raw JSON.

The desk endpoint accepts:

- Simple desk shape: `ownerName`, `email`, `propertyAddress`, optional `phone`, `city`, `notes`, `services`, …
- WordPress extras: `formSource` = `owner-intake-rwr` or `placement-intake-rwr`, `fluentFormId` = `4` or `5`, plus any Fluent field keys in the body.

Desk lead **source** is set automatically:

- Form 4 → `WordPress owner intake (Form 4)`
- Form 5 → `WordPress placement intake (Form 5)`

## Day-to-day workflow (no webhook)

Works today without any tech change:

1. Owner fills form on robyngraham.ca (you send them the link + page password, or remove the password for public use).  
2. You get Fluent Forms email → review in WP Entries.  
3. You add or update the lead in the desk manually (or wait until webhook is on).  

## Public vs private intake

| Goal | Recommendation |
|------|----------------|
| Only invited owners | Keep password protection; send password separately |
| Anyone can request management | Remove page password; use Fluent Forms spam protection |
| Quick inquiry only | Point marketing to https://robyngraham.ca/rental-analysis and use desk `/intake.html` on Render for a lighter form |

## Do not commit

Never put the WordPress page password, Fluent API keys, or webhook secrets in git. Set webhook secrets only in Render environment variables if you add auth later.

*Passwords and form notification settings live only in WordPress and your password manager.*