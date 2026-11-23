# Rent With Robyn — BC Residential Property Management Toolkit

**Robyn Graham | Real Estate & Property Management · Stonehaus Realty Corp.**
*Real estate with grit, heart & strategy.* · 778 926 3481 · robyn@rentwithrobyn.ca · robyngraham.ca

A complete, plain-language document toolkit + one-page portal so a new property manager in Langley, BC can operate lawfully and competently from day one. **Residential tenancies only** — commercial properties are out of scope.

## What's in this folder

| File | What it is |
|---|---|
| `portal.html` | **The one-stop hub.** Single self-contained HTML file (logos embedded). Open it in any browser to browse, search, and open every document. |
| `00-compliance-foundation.md` | Licensing (RESA/BCFSA), Langley business licences, trust accounts, record keeping, insurance — plus the go/no-go test and gap flags. **Read this first.** |
| `01-property-management-agreement.md` / `.docx` | Property Management Agreement with three selectable service models (owner-coordinated · full-service · placement-only). **Pre-filled ready-to-use version** — Word file ready to fill in party details and sign; defaults marked "assumed" for easy adjustment. |
| `02-tenant-placement-agreement.md` / `.docx` | Tenant Placement Service Agreement — **your working package's Document 1**, pre-filled to your terms: 50% of one month's rent (min $1,000), earned when the landlord-approved tenant signs, 7-day termination, deposit-handling options, optional replacement term, managing-broker sign-off list. |
| `03-disclosures-and-statutory-forms.md` | Every required disclosure and statutory form, with when each is required and who signs it — including the BCFSA Payments & Benefits and Interest in Trade disclosures — plus drafted templates where no official form exists (Notice of Entry, Rent Receipt, Pet Addendum, Notice of Landlord's Name & Address). **Form numbers verified against the RTB's current official list (Sept 2026).** |
| `04-industry-research.md` | What competing BC property managers use: their document sets, service models, and fee benchmarks — plus the gaps now filled in this kit. |
| `05`–`09` (`.md` / `.docx`) | **Your Tenant Placement Package, Documents 2–6:** Property Information & Authorization, Rental Application, Screening Consent, Tenant Approval Record, Placement Completion & Handover Checklist. |
| `10`–`12` (`.md` / `.docx`) | Industry-standard additions: Pre-Authorized Debit (PAD) Agreement, Monthly Owner Statement, Strata Document Request. |
| `13`–`14` (`.md` / `.docx`) | Your Placement File Checklist & run sheet (internal), and the Tenant Placement "How It Works" client one-pager. |
| `15-property-owner-guide.md` | Source copy for **The Property Owner's Guide** (`public/guides/landlord-guide.pdf`) — *Own it. Don't babysit it.* |
| `scripts/build-docx.py` | Regenerates the two `.docx` files from the `.md` sources after you change any fee or clause. Run: `python3 scripts/build-docx.py` (requires `pip3 install --user python-docx`). |
| `assets/` | Branding files: `rg_logo.png` (Robyn Graham name logo), `sh_colour.png` and `sh_white.png` (Stonehaus Realty lockups). Never recolour or crop the Stonehaus lockup. |

## How to use

1. **Read `00-compliance-foundation.md` first** — confirm licensing, business licences, trust account and insurance are in place before signing anything.
2. Open `portal.html` in a browser — it is the daily working hub.
3. The `.md` files are clean, editable text: open in any editor and copy into Word or Google Docs to brand and print. Delete the service models you don't use and fill every blank.
4. **Official forms:** RTB forms (RTB-1, RTB-27, RTB-7, RTB-8, RTB-30, RTB-33, RTB-29, RTB-32L via the RTB portal, RTB-12L dispute applications), BCFSA disclosure forms, and Strata Property Act forms (Form B, Form K) must be used in their current official versions — download fresh from the links in the portal each time. Never retype them.

## Hosting & sharing the portal

- **In the Property Management Desk:** this toolkit is wired into your app — the sidebar and Forms library link to `/toolkit/portal.html`, and every document is downloadable from the desk's Forms library (`forms-manifest.json` lists them under "Rent with Robyn — rebuilt in toolkit"). `/portal.html` redirects to the portal for old links.
- **Just share it:** zip this whole folder and send it. The recipient unzips and double-clicks `portal.html`.
- **Share a link:** drag the folder to Netlify Drop (app.netlify.com/drop) or push to GitHub Pages. Keep `portal.html`, the `.md` files, and `assets/` together in the same folder.
- **Offline:** the page itself needs no server. Fonts load from Google Fonts when online; system fonts are used as fallback offline.

## Branding

- Colours: Ink `#0D0D0D` · Teal `#00ADC0` · Warm White `#FAF8F5` · Mist `#EEF1F2`
- Type: Playfair Display (headlines, 700/900) · Montserrat (labels in wide-tracked caps, body)
- Every branded graphic carries the Stonehaus lockup — never recoloured or cropped.
- Contact block: 778 926 3481 · robyn@rentwithrobyn.ca · robyngraham.ca

## Verify before you use

RTB form versions, the annual rent-increase cap, the security-deposit interest rate, BCFSA disclosure forms, and City/Township of Langley licence bylaws all change. Each flagged item in the documents says what to check and where.

**This toolkit was AI-drafted as a plain-language starting point. It is not legal advice. Have a BC lawyer review before first use — most importantly the Property Management Agreement and the Tenant Placement Service Agreement.**
