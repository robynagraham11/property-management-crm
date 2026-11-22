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

function send(res, status, body, type = "application/json") {
  const contentType = type.startsWith("text/") || type === "application/json" || type === "application/javascript" ? `${type}; charset=utf-8` : type;
  res.writeHead(status, { "Content-Type": contentType });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
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

function serveFile(res, requestedPath) {
  if (requestedPath.startsWith("/toolkit/")) {
    const toolkitFile = decodeURIComponent(requestedPath.slice("/toolkit/".length));
    const filePath = path.resolve(root, "toolkit", toolkitFile);
    if (!filePath.startsWith(path.join(root, "toolkit")) || !fs.existsSync(filePath)) return send(res, 404, { error: "Not found" });
    const types = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".png": "image/png", ".md": "text/markdown", ".pdf": "application/pdf", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
    return send(res, 200, fs.readFileSync(filePath), types[path.extname(filePath)] || "text/plain");
  }
  const fileName = requestedPath === "/" ? "index.html" : requestedPath === "/logo.png" ? "9a3a0b6c-02a5-4786-ad21-e4a6f1db135c (1).png" : decodeURIComponent(requestedPath.slice(1));
  const filePath = path.resolve(root, "public", fileName);
  if (!filePath.startsWith(path.join(root, "public")) || !fs.existsSync(filePath)) return send(res, 404, { error: "Not found" });
  const types = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp", ".md": "text/markdown", ".pdf": "application/pdf" };
  send(res, 200, fs.readFileSync(filePath), types[path.extname(filePath)] || "text/plain");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts[0] !== "api") return serveFile(res, url.pathname);
  if (parts[1] === "intake") {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
    try {
      const submission = await body(req);
      if (!submission.ownerName || !submission.email || !submission.propertyAddress) return send(res, 400, { error: "Please provide your name, email, and property address." });
      const data = readData();
      const intake = { id: randomUUID(), createdAt: new Date().toISOString(), ...submission };
      const lead = { id: randomUUID(), createdAt: intake.createdAt, name: submission.ownerName, contactName: submission.ownerName, email: submission.email, phone: submission.phone || "", propertyType: submission.propertyType || "", source: "Owner intake form", stage: "New", nextFollowUp: "", intakeId: intake.id, notes: `Property: ${submission.propertyAddress}${submission.city ? `, ${submission.city}` : ""}\nTimeline: ${submission.timeline || "Not provided"}\nCurrent tenant: ${submission.occupancy || "Not provided"}\nRequested help: ${submission.services || "Not provided"}\nNotes: ${submission.notes || ""}` };
      data.intakeSubmissions.push(intake);
      data.leads.push(lead);
      writeData(data);
      return send(res, 201, { message: "Thanks. Your request has been received.", leadId: lead.id });
    } catch (error) { return send(res, 400, { error: error.message }); }
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

if (require.main === module) server.listen(port, () => console.log(`Property CRM running at http://localhost:${port}`));
module.exports = { server, seedData };
