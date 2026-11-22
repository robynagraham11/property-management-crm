const api = (path, options) => fetch(`/api/${path}`, options).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Request failed"); return data; });
const placementTemplate = [
  { key: "ownerGuide", label: "Owner guide or rental review summary shared", doc: "landlord-guide.pdf" },
  { key: "dorts", label: "BCFSA disclosure of representation (owner)", doc: "bcfsa-disclosure-of-representation.pdf" },
  { key: "payments", label: "Payments and benefits disclosure", doc: "bcfsa-payments-and-benefits-rental-owner.pdf" },
  { key: "agreement", label: "Management or placement agreement signed", doc: "01 or 02 toolkit agreement" },
  { key: "ownerIntake", label: "Property information and authorization", doc: "05 toolkit" },
  { key: "tenantDisclosure", label: "Disclosure for residential tenancies (prospects)", doc: "bcfsa-disclosure-for-residential-tenancies.pdf" },
  { key: "applications", label: "Applications and screening consent on file", doc: "06 + 07 toolkit" },
  { key: "approval", label: "Tenant approval record (landlord signed)", doc: "08 toolkit" },
  { key: "rtb1", label: "RTB-1 signed; copy to tenant within 21 days", doc: "rtb-1" },
  { key: "rtb27", label: "RTB-27 move-in; copy within 7 days", doc: "rtb-27" },
  { key: "deposits", label: "Deposits via brokerage trust (max ½ month each)", doc: "brokerage receipt" },
  { key: "close", label: "Placement handover or ongoing management file open", doc: "09 or monthly statement" }
];
const state = { leads: [], properties: [], tasks: [], documents: [], leases: [], applicants: [], placementFiles: [], formLibrary: null, filter: "All", editing: null };
const $ = selector => document.querySelector(selector);
const titles = { home: "Keep the right things moving.", leads: "Owner leads", portfolio: "Portfolio", leasing: "Leasing & tenancies", screening: "Applicant screening", forms: "Forms library", tasks: "Tasks & maintenance" };
const schemas = {
  leads: [["name","Owner or company",true],["contactName","Primary contact",true],["email","Email","email"],["phone","Phone"],["propertyType","Rental type","select","Condo|Townhouse|House|Suite|Multi-unit"],["stage","Stage","select","New|Contacted|Qualified|Rental analysis|Agreement sent|Appointed|Closed"],["nextFollowUp","Next follow-up","date"],["notes","What does the owner need?","textarea"]],
  properties: [["name","Property name",true],["address","Street address",true],["city","City",true],["type","Rental type","select","Condo|Townhouse|House|Suite|Multi-unit"],["ownerName","Owner",true],["unitCount","Units","number"],["notes","Management notes","textarea"]],
  documents: [["title","Form or file",true],["formType","Type","select","Management agreement|Tenancy agreement|Condition inspection|Notice|Owner record|Other"],["status","Status","select","To prepare|Sent|Awaiting signature|Complete|Archived"],["relatedTo","Related owner, tenant, or property"],["dueDate","Due date","date"],["fileReference","Final file location or link"],["notes","Notes","textarea"]],
  tasks: [["title","Task",true],["status","Status","select","Open|In progress|Complete"],["dueDate","Due date","date"],["relatedTo","Related owner, tenant, or property"],["notes","Notes","textarea"]],
  leases: [["tenantName","Tenant name",true],["propertyName","Property",true],["status","Status","select","Applicant|Active|Ending|Ended"],["startDate","Start date","date"],["endDate","End date","date"],["notes","Tenancy notes","textarea"]],
  applicants: [["fullName","Applicant name",true],["email","Email","email"],["phone","Phone"],["propertyAddress","Property applied for",true],["consentDate","Screening consent signed","date"],["idCheck","Photo ID viewed","select","Not started|Complete"],["landlordRef","Landlord references","select","Blocked|Not started|In progress|Complete"],["employment","Employment check","select","Blocked|Not started|In progress|Complete"],["credit","Credit check","select","Blocked|Not started|In progress|Complete"],["decision","Decision","select","Reviewing|Shortlisted|Approved|Declined|Withdrawn"],["notes","Factual screening notes","textarea"]],
  placementFiles: [["propertyAddress","Property address",true],["ownerName","Owner name",true],["serviceType","Service","select","Placement only|Full management"],["status","Status","select","Onboarding|Marketing|Screening|Lease|Active|Closed"],["notes","File notes","textarea"]]
};
function escape(value="") { return String(value).replace(/[&<>"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" })[character]); }
function badge(value="") { return `<span class="badge ${escape(value).replaceAll(" ", ".")}">${escape(value || "Open")}</span>`; }
function formFields(collection, record={}) {
  return schemas[collection].map(([name,label,type,choices]) => {
    let input;
    const val = record[name] ?? "";
    if (type === "textarea") input = `<textarea name="${name}">${escape(val)}</textarea>`;
    else if (type === "select") input = `<select name="${name}">${choices.split("|").map(item => `<option ${val === item ? "selected" : ""}>${item}</option>`).join("")}</select>`;
    else input = `<input name="${name}" type="${["email","date","number"].includes(type) ? type : "text"}" value="${escape(val)}" ${type === true ? "required" : ""}>`;
    return `<label class="${type === "textarea" ? "wide" : ""}">${label}${input}</label>`;
  }).join("");
}
function renderStats() {
  const openTasks = state.tasks.filter(item => item.status !== "Complete").length;
  const active = state.leads.filter(item => !["Closed","Appointed"].includes(item.stage)).length;
  const screening = state.applicants.filter(item => !["Approved","Declined","Withdrawn"].includes(item.decision || "Reviewing")).length;
  $("#stats").innerHTML = [["Owner leads",active],["Managed homes",state.properties.length],["In screening",screening],["Open tasks",openTasks],["Forms in progress",state.documents.filter(item => !["Complete","Archived"].includes(item.status)).length]].map(([label,value]) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`).join("");
}
function renderPriorities() {
  const items = [...state.tasks.filter(item => item.status !== "Complete").map(item => ({ title:item.title, detail:item.relatedTo || "General task", date:item.dueDate, status:item.status })), ...state.leads.filter(item => item.nextFollowUp).map(item => ({ title:`Follow up: ${item.name}`, detail:item.contactName || "Owner lead", date:item.nextFollowUp, status:item.stage }))].sort((a,b) => (a.date || "9999").localeCompare(b.date || "9999")).slice(0,5);
  $("#priorityList").innerHTML = items.length ? items.map(item => `<div class="priority-row"><div><strong>${escape(item.title)}</strong><p>${escape(item.detail)}</p></div><span class="due">${escape(item.date || "No date")}</span></div>`).join("") : `<p class="empty">No open priorities. Add a task or schedule a follow-up.</p>`;
}
function renderPipeline() {
  const stages = ["New","Contacted","Qualified","Rental analysis","Agreement sent","Appointed"];
  const max = Math.max(1,...stages.map(stage => state.leads.filter(item => item.stage === stage).length));
  $("#pipelineSummary").innerHTML = stages.map(stage => { const count = state.leads.filter(item => item.stage === stage).length; return `<div class="pipeline-bar"><div><span>${stage}</span><strong>${count}</strong></div><i><span style="width:${count / max * 100}%"></span></i></div>`; }).join("");
}
function renderOwnerGuideStrip() {
  const el = $("#ownerGuideStrip");
  if (!el) return;
  el.innerHTML = `<article class="panel owner-guide"><div class="panel-title"><div><p class="kicker">OWNER LEAVE-BEHIND</p><h2>Own it. Don't babysit it.</h2></div><a class="cta" href="/guides/landlord-guide.pdf" target="_blank" rel="noreferrer">Open PDF</a></div><p style="margin:0;color:var(--muted);font-size:13px">Send after a rental review. <a href="/guides/">Web version</a> · <a href="mailto:robyn@rentwithrobyn.ca?subject=Free%20rental%20review">Email CTA</a></p></article>`;
}
function renderLeads() {
  const stages = ["All","New","Contacted","Qualified","Rental analysis","Agreement sent","Appointed","Closed"];
  $("#leadFilters").innerHTML = stages.map(stage => `<button class="${state.filter === stage ? "active" : ""}" data-filter="${stage}">${stage}</button>`).join("");
  const rows = state.filter === "All" ? state.leads : state.leads.filter(item => item.stage === state.filter);
  $("#leadList").innerHTML = rows.length ? rows.map(item => record(item, "leads", item.name, `${item.contactName || "No contact"} · ${item.propertyType || "Rental type pending"}`, item.stage, item.nextFollowUp, item.email || item.phone)).join("") : empty("No owner leads in this stage.");
}
function record(item, collection, title, description, status, date, extra) { return `<article class="record"><div><h3>${escape(title)}</h3><p>${escape(description)}</p></div><div>${badge(status)}</div><div class="record-meta"><strong>${escape(date || "No date set")}</strong><p>${escape(extra || "")}</p></div><button class="edit" data-edit="${collection}:${item.id}">Edit</button></article>`;
function empty(text) { return `<p class="empty">${text}</p>`; }
function renderProperties() { $("#propertyList").innerHTML = state.properties.length ? state.properties.map(item => record(item,"properties",item.name,`${item.address || "Address pending"}${item.city ? `, ${item.city}` : ""}`,item.type,item.ownerName,`${item.unitCount || 1} unit${Number(item.unitCount) === 1 ? "" : "s"}`)).join("") : empty("No properties yet. Add one when an owner appoints you."); }
function renderLeases() { $("#leaseList").innerHTML = state.leases.length ? state.leases.map(item => record(item,"leases",item.tenantName,item.propertyName,item.status,item.endDate,item.startDate ? `Started ${item.startDate}` : "")).join("") : empty("No tenancy records yet."); }
function renderApplicants() {
  $("#applicantList").innerHTML = state.applicants.length ? state.applicants.map(item => {
    const blocked = !item.consentDate;
    const extra = blocked ? "Consent required before checks" : `Consent ${item.consentDate}`;
    return record(item,"applicants",item.fullName,`${item.propertyAddress || "Property pending"} · ${item.email || item.phone || ""}`,item.decision || "Reviewing",item.consentDate,extra);
  }).join("") : empty("No applicants yet. Add one when an application comes in.");
}
function stampClass(stamp) { return ({ use:"use", replace:"replace", stop:"stop" }[stamp] || "replace"); }
function libraryCard(item) {
  const links = [];
  if (item.file) links.push(`<a href="${escape(item.file)}" target="_blank" rel="noreferrer">Open file</a>`);
  if (item.docx) links.push(`<a href="${escape(item.docx)}" target="_blank" rel="noreferrer">Word</a>`);
  if (item.officialUrl) links.push(`<a href="${escape(item.officialUrl)}" target="_blank" rel="noreferrer">Official source</a>`);
  return `<article class="library-card"><div><span class="stamp ${stampClass(item.stamp)}">${escape(item.stamp || "use")}</span>${item.version ? `<p class="kicker" style="margin:8px 0 0">${escape(item.version)}</p>` : ""}</div><div><h3>${escape(item.title)}</h3><p>${escape(item.summary || item.when || "")}</p></div><div class="library-actions">${links.join("") || ""}</div></article>`;
}
function renderFormLibrary() {
  const root = $("#library");
  if (!root) return;
  if (!state.formLibrary) { root.innerHTML = empty("Loading forms…"); return; }
  root.className = "library";
  root.innerHTML = state.formLibrary.categories.map(cat => `<div class="view-head subhead" style="margin:24px 0 12px"><div><p class="kicker">${escape(cat.title.toUpperCase())}</p></div></div>${cat.items.map(libraryCard).join("")}`).join("");
}
function renderPlacementFiles() {
  const root = $("#placementList");
  if (!root) return;
  root.innerHTML = state.placementFiles.length ? state.placementFiles.map(file => {
    const checks = file.checklist || {};
    const rows = placementTemplate.map(step => {
      const val = checks[step.key] || "";
      const cls = val === "done" ? "on" : val === "na" ? "na" : "";
      const label = val === "done" ? "Done" : val === "na" ? "N/A" : "Mark";
      return `<div class="check-row"><span>${escape(step.label)}</span><button type="button" class="${cls}" data-placement-check="${file.id}:${step.key}">${label}</button></div>`;
    }).join("");
    return `<article class="check-file"><header><strong>${escape(file.propertyAddress)}</strong> · ${escape(file.ownerName)} · ${badge(file.status)}</header><p style="color:var(--muted);font-size:12px;margin:0 0 8px">${escape(file.serviceType || "")}</p>${rows}<button class="edit" data-edit="placementFiles:${file.id}">Edit file</button></article>`;
  }).join("") : empty("No placement files yet. Start one when an owner signs on.");
}
function renderForms() { renderFormLibrary(); renderPlacementFiles(); $("#formList").innerHTML = state.documents.length ? state.documents.map(item => record(item,"documents",item.title,`${item.formType || "File"} · ${item.relatedTo || "Not linked"}`,item.status,item.dueDate,item.fileReference)).join("") : empty("No forms are being tracked yet."); }
function renderTasks() { $("#taskList").innerHTML = state.tasks.length ? state.tasks.filter(item => item.status !== "Complete").map(item => record(item,"tasks",item.title,item.relatedTo || "General task",item.status,item.dueDate,item.notes)).join("") : empty("No open tasks. That is a good place to be."); }
function renderAll() { renderStats(); renderPriorities(); renderPipeline(); renderOwnerGuideStrip(); renderLeads(); renderProperties(); renderLeases(); renderApplicants(); renderForms(); renderTasks(); }
function collectionLabel(collection) {
  return ({ leads:"owner lead", properties:"property", documents:"form or file", leases:"tenancy", tasks:"task", applicants:"applicant", placementFiles:"placement file" })[collection] || "record";
}
function openModal(collection, item) {
  state.editing = item || null;
  const defaults = collection === "applicants" && !item ? { landlordRef:"Blocked", employment:"Blocked", credit:"Blocked", idCheck:"Not started", decision:"Reviewing" } : collection === "placementFiles" && !item ? { status:"Onboarding", checklist:Object.fromEntries(placementTemplate.map(s => [s.key,""])) } : {};
  const recordData = { ...defaults, ...item };
  $("#modalKicker").textContent = item ? "EDIT RECORD" : "NEW RECORD";
  $("#modalTitle").textContent = `${item ? "Edit" : "Add"} ${collectionLabel(collection)}`;
  $("#modalFields").innerHTML = formFields(collection, recordData);
  $("#editorForm").dataset.collection = collection;
  $("#editor").showModal();
}
async function load() {
  const [leads, properties, tasks, documents, leases, applicants, placementFiles, formLibrary] = await Promise.all([
    api("leads"), api("properties"), api("tasks"), api("documents"), api("leases"), api("applicants"), api("placementFiles"),
    fetch("/forms-manifest.json").then(r => r.json())
  ]);
  Object.assign(state, { leads, properties, tasks, documents, leases, applicants, placementFiles, formLibrary });
  renderAll();
}
async function togglePlacementCheck(fileId, key) {
  const file = state.placementFiles.find(item => item.id === fileId);
  if (!file) return;
  const checklist = { ...(file.checklist || {}) };
  const cycle = { "":"done", done:"na", na:"" };
  checklist[key] = cycle[checklist[key] || ""] ?? "done";
  await api(`placementFiles/${fileId}`, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ checklist }) });
  await load();
}
document.addEventListener("click", event => {
  const view = event.target.dataset.view;
  if (view) {
    document.querySelectorAll(".view, nav button").forEach(element => element.classList.remove("active"));
    $(`#${view}`).classList.add("active");
    document.querySelector(`nav button[data-view="${view}"]`)?.classList.add("active");
    $("#pageTitle").textContent = titles[view];
  }
  const create = event.target.dataset.create;
  if (create) openModal(create);
  const filter = event.target.dataset.filter;
  if (filter) { state.filter = filter; renderLeads(); }
  const edit = event.target.dataset.edit;
  if (edit) {
    const [collection, id] = edit.split(":");
    const item = state[collection].find(record => record.id === id);
    if (item) openModal(collection, item);
  }
  const pc = event.target.dataset.placementCheck;
  if (pc) { const [fileId, key] = pc.split(":"); togglePlacementCheck(fileId, key); }
});
$("#quickLead").onclick = () => openModal("leads");
$("#quickTask").onclick = () => openModal("tasks");
const newPlacement = $("#newPlacement");
if (newPlacement) newPlacement.onclick = () => openModal("placementFiles");
$("#closeModal").onclick = () => $("#editor").close();
$("#cancelModal").onclick = () => $("#editor").close();
$("#editorForm").onsubmit = async event => {
  event.preventDefault();
  const collection = event.currentTarget.dataset.collection;
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
  if (collection === "placementFiles" && state.editing?.checklist) payload.checklist = state.editing.checklist;
  const path = state.editing ? `${collection}/${state.editing.id}` : collection;
  await api(path, { method: state.editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  $("#editor").close();
  await load();
};
$("#today").textContent = new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
load().catch(error => { document.querySelector("main").insertAdjacentHTML("beforeend", `<p class="error">${escape(error.message)}</p>`); });