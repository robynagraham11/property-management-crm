const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const port = Number(process.env.PORT || 3000);
const root = __dirname;
const dataFile = path.join(root, "data", "crm.json");
const collections = ["leads", "contacts", "properties", "units", "tasks", "workOrders", "leases", "documents", "complianceItems", "intakeSubmissions", "applicants", "placementFiles"];

function seedData() {
  return {
    leads: [
      { id: "lead-1", name: "North Shore Holdings", contactName: "Maya Chen", email: "maya@example.com", phone: "604-555-0184", propertyType: "Residential", source: "Referral", stage: "New", nextFollowUp: "", notes: "Owns a 12-unit building in North Vancouver.", createdAt: new Date().toISOString() },
      { id: "lead-2", name: "Harbourview Strata Council", contactName: "Daniel Price", email: "daniel@example.com", phone: "604-555-0128", propertyType: "Strata", source: "Website", stage: "Qualified", nextFollowUp: "", notes: "Seeking a new management company before the AGM.", createdAt: new Date().toISOString() }
    ],
    contacts: [], properties: [], units: [], tasks: [], workOrders: [], leases: [], documents: [],
    complianceItems: [
      { id: "compliance-1", title: "Brokerage licensing and renewal dates", category: "Licensing", status: "Needs review", owner: "Robyn Graham", dueDate: "", evidence: "", sourceUrl: "https://www.bcfsa.ca/industry-resources/real-estate-professional-resources/education-and-licensing/licensing-forms", notes: "Confirm your licence, brokerage, renewal, and IRIS obligations with your managing broker.", createdAt: new Date().toISOString() },
      { id: "compliance-2", title: "Brokerage policies and procedures", category: "Brokerage", status: "Needs review", owner: "Robyn Graham", dueDate: "", evidence: "", sourceUrl: "https://www.bcfsa.ca/industry-resources/real-estate-professional-resources", notes: "Obtain the brokerage-approved policies before taking on clients or handling records.", createdAt: new Date().toISOString() },
      { id: "compliance-3", title: "Residential tenancy form and notice currency", category: "Residential", status: "Needs review", owner: "Robyn Graham", dueDate: "", evidence: "", sourceUrl: "https://www2.gov.bc.ca/gov/content/housing-tenancy/residential-tenancies/calculators-and-resources", notes: "Use current official RTB forms for each tenancy event. Do not rely on saved old copies.", createdAt: new Date().toISOString() },
      { id: "compliance-4", title: "Trust accounting and records workflow", category: "Financial", status: "Needs review", owner: "Robyn Graham", dueDate: "", evidence: "", sourceUrl: "https://www.bcfsa.ca/industry-resources/real-estate-professional-resources", notes: "Set up only through brokerage-approved accounting systems and controls. This CRM must not be used for trust accounting.", createdAt: new Date().toISOString() }
    ], intakeSubmissions: [], applicants: [], placementFiles: []
  };
}

const consentChecks = ["landlordRef", "employment", "credit"];

function guardApplicant(record) {
  if (record.consentDate) return record;
  for (const field of consentChecks) {
    if (record[field] && !["Not started", "Blocked"].includes(record[field])) {
      const error = new Error("Landlord, employer, and credit checks stay blocked until written screening consent is on file.");
      error.status = 400;
      throw error;
    }
  }
  return record;
}

function readData() {
  if (!fs.existsSync(dataFile)) {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(seedData(), null, 2));
  }
  const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  let changed = false;
  for (const collection of collections) {
    if (!Array.isArray(data[collection])) { data[collection] = collection === "complianceItems" ? seedData().complianceItems : []; changed = true; }
  }
  if (changed) writeData(data);
  return data;
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

const intakeOrigins = new Set(["https://robyngraham.ca", "https://www.robyngraham.ca", "http://localhost:3000", "http://127.0.0.1:3000"]);

function corsHeaders(req) {
  const origin = req.headers.origin;
  if (!origin || !intakeOrigins.has(origin)) return {};
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
}

function send(res, status, body, type = "application/json", extraHeaders = {}) {
  const contentType = type.startsWith("text/") || type === "application/json" || type === "application/javascript" ? `${type}; charset=utf-8` : type;
  res.writeHead(status, { "Content-Type": contentType, ...extraHeaders });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

function intakeIdentity(submission) {
  const first = submission.first_name || submission.firstName || "";
  const last = submission.last_name || submission.lastName || "";
  const ownerName = (submission.ownerName || submission.name || `${first} ${last}`).trim();
  const email = submission.email || submission.email_address || "";
  const phone = submission.phone || submission.phone_number || "";
  const propertyAddress = submission.propertyAddress
    || submission.rental_property_address
    || submission.rentalPropertyAddress
    || [submission.rental_address_line_1, submission.rental_address_line_2].filter(Boolean).join(", ")
    || submission.address_line_1
    || "";
  return { ownerName, email, phone, propertyAddress };
}

function leadSource(submission) {
  if (submission.fluentFormId === 5 || submission.formSource === "placement-intake-rwr") return "WordPress placement intake (Form 5)";
  if (submission.fluentFormId === 4 || submission.formSource === "owner-intake-rwr") return "WordPress owner intake (Form 4)";
  if (submission.formSource) return submission.formSource;
  return "Owner intake form";
}

function intakeNotes(submission, identity) {
  if (submission.notes) return submission.notes;
  const skip = new Set(["ownerName", "first_name", "lastName", "firstName", "last_name", "email", "phone", "propertyAddress"]);
  const lines = Object.entries(submission)
    .filter(([key, value]) => !skip.has(key) && value != null && String(value).trim() !== "")
  .map(([key, value]) => `${key}: ${value}`);
  return [`Property: ${identity.propertyAddress || "See submission"}`, ...lines.slice(0, 24)].join("\n");
}

function body(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("Request body must be valid JSON.")); }
    });
  });
}

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function slugify(text) { return text.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s/g, "-"); }
const INLINE_RE = /(\*\*.+?\*\*|\*[^*\n]+?\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;
function inlineMd(s) {
  return String(s).replace(INLINE_RE, token => {
    if (token.startsWith("**")) return `<strong>${escapeHtml(token.slice(2, -2))}</strong>`;
    if (token.startsWith("`")) return `<code>${escapeHtml(token.slice(1, -1))}</code>`;
    if (token.startsWith("[")) {
      const [label, url] = token.slice(1, -1).split("](", 2);
      const safe = /^https?:\/\//.test(url) ? url : "";
      return `<a href="${escapeHtml(url)}"${safe ? ' target="_blank" rel="noreferrer"' : ""}>${escapeHtml(label)}</a>`;
    }
    return `<em>${escapeHtml(token.slice(1, -1))}</em>`;
  });
}
function renderMarkdownPage(md, fileName) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const body = [];
  let inCode = false, codeBuf = [], listBuf = [], tableBuf = [];
  const flushList = () => { if (listBuf.length) { body.push(`<ul>${listBuf.map(li => `<li>${li}</li>`).join("")}</ul>`); listBuf = []; } };
  const flushTable = () => {
    tableBuf = tableBuf.filter(Boolean);
    if (!tableBuf.length) return;
    const header = tableBuf[0], rows = tableBuf.slice(1);
    body.push(`<table><thead><tr>${header.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
    tableBuf = [];
  };
  const flushAll = () => { flushList(); flushTable(); };
  for (let line of lines) {
    const stripped = line.trim();
    if (inCode) {
      if (stripped.startsWith("```")) { body.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`); codeBuf = []; inCode = false; }
      else codeBuf.push(line);
      continue;
    }
    if (stripped.startsWith("```")) { flushAll(); inCode = true; codeBuf = []; continue; }
    if (stripped === "---") { flushAll(); body.push("<hr>"); continue; }
    if (stripped === "") { flushAll(); continue; }
    if (stripped.startsWith("|")) {
      flushList();
      const cells = stripped.slice(1, -1).split("|").map(c => c.trim());
      if (cells.every(c => /^:?-{2,}:?$/.test(c))) { tableBuf.push(null); continue; }
      tableBuf.push(cells.map(c => inlineMd(c).replace("[ ]", "☐")));
      continue;
    }
    if (tableBuf.length) flushTable();
    if (stripped.startsWith(">> ")) { flushAll(); body.push(`<blockquote class="nested">${inlineMd(stripped.slice(3))}</blockquote>`); continue; }
    if (stripped.startsWith("> ")) { flushAll(); body.push(`<blockquote>${inlineMd(stripped.slice(2))}</blockquote>`); continue; }
    if (stripped.startsWith("- ")) { flushTable(); listBuf.push(inlineMd(stripped.slice(2)).replaceAll("[ ]", "☐")); continue; }
    if (listBuf.length) flushList();
    const heading = stripped.match(/^(#{1,4})\s+(.*)$/);
    if (heading) { flushAll(); const level = heading[1].length; const text = heading[2]; body.push(`<h${level} id="${escapeHtml(slugify(text))}">${inlineMd(text)}</h${level}>`); continue; }
    if (/^\d+\.\d*\s/.test(stripped)) { flushAll(); body.push(`<p class="clause">${inlineMd(stripped).replaceAll("[ ]", "☐")}</p>`); continue; }
    flushAll();
    body.push(`<p>${inlineMd(stripped).replaceAll("[ ]", "☐")}</p>`);
  }
  if (inCode) body.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
  flushAll();
  const title = (lines.find(l => /^#\s/.test(l.trim())) || "# Document").trim().replace(/^#\s*/, "");
  const rawLink = `${fileName}?raw=1`;
  return `<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — Rent with Robyn Toolkit</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
<style>
:root{--ink:#0D0D0D;--teal:#00ADC0;--teal-dark:#008A99;--warm:#FAF8F5;--mist:#EEF1F2;--line:#E3DED5}
*{box-sizing:border-box;margin:0;padding:0}
body{font:400 15px/1.7 Montserrat,Arial,sans-serif;background:var(--warm);color:var(--ink)}
.doc{max-width:860px;margin:0 auto;padding:34px 24px 60px}
h1{font:900 28px/1.2 'Playfair Display',Georgia,serif;margin:0 0 4px}
h2{font:900 22px/1.25 'Playfair Display',Georgia,serif;margin:30px 0 10px}
h3{font:700 17px/1.3 'Playfair Display',Georgia,serif;margin:22px 0 8px}
h4{font:700 12px/1.4 Montserrat,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--teal-dark);margin:18px 0 6px}
p{margin:0 0 12px}
a{color:var(--teal-dark)}
hr{border:0;border-top:1px solid var(--line);margin:26px 0}
ul{padding-left:22px;margin:0 0 12px}
li{margin:4px 0}
blockquote{border-left:3px solid var(--teal);margin:10px 0 16px;padding:6px 16px;color:#3a4a4d;font-size:14.5px;background:var(--mist);border-radius:0 8px 8px 0}
blockquote.nested{margin-left:24px;font-size:13.5px;background:transparent}
table{border-collapse:collapse;width:100%;margin:0 0 18px;background:#fff;font-size:13.5px}
th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}
th{background:var(--ink);color:#fff;font:700 11px/1.4 Montserrat,sans-serif;letter-spacing:.06em;text-transform:uppercase}
pre{background:var(--ink);color:#E8F5F6;padding:16px;border-radius:8px;overflow-x:auto;font:400 12.5px/1.55 'DM Mono',Menlo,monospace;margin:0 0 18px;white-space:pre-wrap}
code{font-family:'DM Mono',Menlo,monospace;font-size:.92em;background:var(--mist);padding:1px 6px;border-radius:4px}
p.clause{padding-left:22px;text-indent:-22px}
.doc-bar{max-width:860px;margin:0 auto;padding:14px 24px 0;display:flex;gap:10px;flex-wrap:wrap}
.doc-bar a{font:600 11.5px Montserrat,sans-serif;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;border:1.5px solid var(--teal);border-radius:6px;padding:7px 12px;color:var(--teal-dark)}
.doc-bar a:hover{background:var(--teal);color:#fff}
.foot{max-width:860px;margin:0 auto;padding:0 24px 40px;font-size:12px;color:#777}
</style>
</head>
<body>
<div class="doc-bar"><a href="/toolkit/portal.html">← Toolkit portal</a><a href="${escapeHtml(rawLink)}" download>Download raw text (.md)</a></div>
<main class="doc">${body.join("\n")}</main>
<div class="foot">Robyn Graham · Stonehaus Realty Corp. · 778 926 3481 · robyn@rentwithrobyn.ca · robyngraham.ca — AI-drafted toolkit; not legal advice. Verify official forms and rates before use.</div>
</body>
</html>`;
}

function serveFile(res, requestedPath) {
  if (requestedPath.startsWith("/toolkit/")) {
    const queryIndex = requestedPath.indexOf("?");
    const pathname = queryIndex >= 0 ? requestedPath.slice(0, queryIndex) : requestedPath;
    const query = queryIndex >= 0 ? requestedPath.slice(queryIndex) : "";
    const toolkitFile = decodeURIComponent(pathname.slice("/toolkit/".length));
    const filePath = path.resolve(root, "toolkit", toolkitFile);
    if (!filePath.startsWith(path.join(root, "toolkit")) || !fs.existsSync(filePath)) return send(res, 404, { error: "Not found" });
    if (path.extname(filePath) === ".md" && !query.includes("raw=1")) {
      return send(res, 200, renderMarkdownPage(fs.readFileSync(filePath, "utf8"), toolkitFile), "text/html");
    }
    const types = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".png": "image/png", ".md": "text/markdown", ".pdf": "application/pdf", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
    return send(res, 200, fs.readFileSync(filePath), types[path.extname(filePath)] || "text/plain");
  }
  let fileName = requestedPath.split("?")[0] === "/" ? "index.html" : requestedPath.split("?")[0] === "/logo.png" ? "9a3a0b6c-02a5-4786-ad21-e4a6f1db135c (1).png" : decodeURIComponent(requestedPath.split("?")[0].slice(1));
  if (fileName.endsWith("/")) fileName = `${fileName}index.html`;
  let filePath = path.resolve(root, "public", fileName);
  if (!filePath.startsWith(path.join(root, "public"))) return send(res, 404, { error: "Not found" });
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(filePath, "index.html");
    if (fs.existsSync(indexPath)) filePath = indexPath;
    else return send(res, 404, { error: "Not found" });
  }
  if (!fs.existsSync(filePath)) return send(res, 404, { error: "Not found" });
  const types = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp", ".md": "text/markdown", ".pdf": "application/pdf" };
  send(res, 200, fs.readFileSync(filePath), types[path.extname(filePath)] || "text/plain");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts[0] !== "api") return serveFile(res, url.pathname + url.search);
  if (parts[1] === "intake") {
    const cors = corsHeaders(req);
    if (req.method === "OPTIONS") return send(res, 204, "", "text/plain", cors);
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" }, "application/json", cors);
    try {
      const submission = await body(req);
      const identity = intakeIdentity(submission);
      if (!identity.ownerName || !identity.email) return send(res, 400, { error: "Please provide a name and email." }, "application/json", cors);
      const data = readData();
      const intake = { id: randomUUID(), createdAt: new Date().toISOString(), ...submission, ...identity };
      const lead = {
        id: randomUUID(),
        createdAt: intake.createdAt,
        name: identity.ownerName,
        contactName: identity.ownerName,
        email: identity.email,
        phone: identity.phone || "",
        propertyType: submission.propertyType || submission.property_type || "",
        source: leadSource(submission),
        stage: "New",
        nextFollowUp: "",
        intakeId: intake.id,
        notes: intakeNotes(submission, identity)
      };
      data.intakeSubmissions.push(intake);
      data.leads.push(lead);
      writeData(data);
      return send(res, 201, { message: "Thanks. Your request has been received.", leadId: lead.id }, "application/json", cors);
    } catch (error) { return send(res, 400, { error: error.message }, "application/json", cors); }
  }
  const collection = parts[1];
  if (!collections.includes(collection)) return send(res, 404, { error: "Unknown collection" });

  const data = readData();
  const recordId = parts[2];
  try {
    if (req.method === "GET" && !recordId) return send(res, 200, data[collection]);
    if (req.method === "GET" && recordId) {
      const record = data[collection].find(item => item.id === recordId);
      return record ? send(res, 200, record) : send(res, 404, { error: "Record not found" });
    }
    if (req.method === "POST" && !recordId) {
      const record = { id: randomUUID(), createdAt: new Date().toISOString(), ...await body(req) };
      if (collection === "applicants") guardApplicant(record);
      data[collection].push(record);
      writeData(data);
      return send(res, 201, record);
    }
    if (req.method === "PATCH" && recordId) {
      const index = data[collection].findIndex(item => item.id === recordId);
      if (index < 0) return send(res, 404, { error: "Record not found" });
      const next = { ...data[collection][index], ...await body(req), id: recordId, updatedAt: new Date().toISOString() };
      if (collection === "applicants") guardApplicant(next);
      data[collection][index] = next;
      writeData(data);
      return send(res, 200, data[collection][index]);
    }
    if (req.method === "DELETE" && recordId) {
      const index = data[collection].findIndex(item => item.id === recordId);
      if (index < 0) return send(res, 404, { error: "Record not found" });
      const [deleted] = data[collection].splice(index, 1);
      writeData(data);
      return send(res, 200, deleted);
    }
    return send(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return send(res, error.status || 400, { error: error.message });
  }
});

if (require.main === module) {
  const host = process.env.HOST || "0.0.0.0";
  server.listen(port, host, () => console.log(`Property CRM running at http://${host}:${port}`));
}
module.exports = { server, seedData };
