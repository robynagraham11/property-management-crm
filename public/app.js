const api = (collection, options) => fetch(`/api/${collection}`, options).then(async response => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
});
const state = { leads: [], properties: [], documents: [], complianceItems: [], activeFilter: "All", editing: null };
const $ = selector => document.querySelector(selector);
const titleByView = { dashboard: "Your business at a glance", leads: "Lead pipeline", properties: "Properties & units", forms: "Forms & files", operations: "Operations", compliance: "Compliance register" };

function fields(type, record = {}) {
  const lead = [["name","Organization or lead name",true],["contactName","Primary contact",true],["email","Email","email"],["phone","Phone"],["propertyType","Property type","select","Residential|Strata|Commercial|Mixed"],["source","Lead source","select","Referral|Website|Networking|Outbound|Other"],["stage","Pipeline stage","select","New|Contacted|Qualified|Proposal|Appointed|Closed"],["nextFollowUp","Next follow-up","date"],["notes","Notes","textarea"]];
  const property = [["name","Property name",true],["type","Property type","select","Residential|Strata|Commercial|Mixed"],["address","Street address",true],["city","City",true],["postalCode","Postal code"],["ownerName","Owner / client"],["unitCount","Units / spaces","number"],["notes","Management scope / notes","textarea"]];
  const compliance = [["title","Review item",true],["category","Category","select","Licensing|Brokerage|Residential|Strata|Commercial|Financial|Privacy|Safety|Other"],["status","Status","select","Needs review|In progress|Complete|Not applicable"],["owner","Responsible person"],["dueDate","Review due date","date"],["evidence","Evidence location or reference"],["sourceUrl","Official source URL"],["notes","Notes / decision","textarea"]];
  const form = [["title","Form or file name",true],["formType","Form type","select","Owner / management agreement|Residential tenancy|Strata|Commercial|Disclosure|Notice|Other"],["status","Status","select","To prepare|Sent|Awaiting signature|Complete|Archived"],["relatedTo","Related lead, property, or client"],["dueDate","Due date","date"],["fileReference","Completed file location or link"],["sourceUrl","Official source URL"],["notes","Notes","textarea"]];
  return (type === "leads" ? lead : type === "properties" ? property : type === "documents" ? form : compliance).map(([name, label, required, options]) => {
    let input;
    if (required === "textarea") input = `<textarea name="${name}" class="full">${record[name] || ""}</textarea>`;
    else if (required === "select") input = `<select name="${name}">${options.split("|").map(option => `<option ${record[name] === option ? "selected" : ""}>${option}</option>`).join("")}</select>`;
    else input = `<input name="${name}" type="${required === "date" || required === "number" || required === "email" ? required : "text"}" value="${record[name] || ""}" ${required === true ? "required" : ""}>`;
    return `<label class="${name === "notes" ? "full" : ""}">${label}${input}</label>`;
  }).join("");
}

function renderLeads() {
  const filtered = state.activeFilter === "All" ? state.leads : state.leads.filter(lead => lead.stage === state.activeFilter);
  $("#leadFilters").innerHTML = ["All","New","Contacted","Qualified","Proposal","Appointed","Closed"].map(filter => `<button class="${filter === state.activeFilter ? "active" : ""}" data-filter="${filter}">${filter}</button>`).join("");
  $("#leadList").innerHTML = filtered.length ? filtered.map(lead => `<article class="lead-card"><div><h3>${lead.name}</h3><p>${lead.contactName || "No primary contact"} · ${lead.propertyType || "Type pending"}</p></div><div><span class="badge ${lead.stage}">${lead.stage}</span><p>${lead.source || "Source not set"}</p></div><div><strong>${lead.nextFollowUp || "No follow-up"}</strong><p>${lead.email || lead.phone || "No contact method"}</p></div><button class="text-button" data-edit="${lead.id}">Edit</button></article>`).join("") : "<p>No leads in this stage yet.</p>";
}

function renderProperties() {
  $("#propertyList").innerHTML = state.properties.length ? state.properties.map(item => `<article class="lead-card"><div><h3>${item.name}</h3><p>${item.address}, ${item.city}</p></div><div><span class="badge">${item.type}</span></div><div><strong>${item.unitCount || 0} units / spaces</strong><p>${item.ownerName || "Client pending"}</p></div><button class="text-button" data-property-edit="${item.id}">Edit</button></article>`).join("") : "";
}

function renderCompliance() {
  $("#complianceList").innerHTML = state.complianceItems.length ? state.complianceItems.map(item => `<article class="lead-card"><div><h3>${item.title}</h3><p>${item.category || "Uncategorized"} · ${item.owner || "No owner assigned"}</p></div><div><span class="badge">${item.status || "Needs review"}</span></div><div><strong>${item.dueDate || "No date set"}</strong><p>${item.evidence || "Evidence not linked"}</p></div><button class="text-button" data-compliance-edit="${item.id}">Edit</button></article>`).join("") : "<p>No review items yet. Add the obligations and controls confirmed for your brokerage.</p>";
}

function renderForms() {
  $("#formList").innerHTML = state.documents.length ? state.documents.map(item => `<article class="lead-card"><div><h3>${item.title}</h3><p>${item.formType || "General file"} · ${item.relatedTo || "Not linked"}</p></div><div><span class="badge">${item.status || "To prepare"}</span></div><div><strong>${item.dueDate || "No date set"}</strong><p>${item.fileReference || "No completed file linked"}</p></div><button class="text-button" data-form-edit="${item.id}">Edit</button></article>`).join("") : "<p>No forms or files are tracked yet. Add a record when you begin an owner, tenancy, strata, or commercial workflow.</p>";
}

async function renderDashboard() {
  const [tasks, workOrders, leases, documents] = await Promise.all(["tasks","workOrders","leases","documents"].map(collection => api(collection)));
  $("#metrics").innerHTML = [["Active leads", state.leads.filter(l => !["Closed", "Appointed"].includes(l.stage)).length],["Qualified prospects",state.leads.filter(l => ["Qualified","Proposal"].includes(l.stage)).length],["Managed properties",state.properties.length],["Open work orders",workOrders.filter(item => item.status !== "Closed").length]].map(([label,value]) => `<div class="metric"><p class="eyebrow">${label}</p><strong>${value}</strong></div>`).join("");
  const followups = state.leads.filter(l => l.nextFollowUp).sort((a,b) => a.nextFollowUp.localeCompare(b.nextFollowUp)).slice(0,5);
  $("#actions").innerHTML = followups.length ? followups.map(lead => `<div class="action"><div><strong>${lead.name}</strong><p>${lead.contactName || "Primary contact"} · ${lead.stage}</p></div><small>${lead.nextFollowUp}</small></div>`).join("") : "<p>No follow-ups scheduled. Add one to a lead to keep your pipeline moving.</p>";
  $("#taskCount").textContent = `${tasks.filter(item => item.status !== "Completed").length} open`;
  $("#workOrderCount").textContent = `${workOrders.filter(item => item.status !== "Closed").length} open`;
  $("#leaseCount").textContent = `${leases.filter(item => item.status === "Active").length} active`;
  $("#documentCount").textContent = `${documents.length} stored`;
}

function showForm(collection, record) {
  state.editing = record || null;
  const labels = { leads: "lead", properties: "property", documents: "form record", complianceItems: "review item" };
  $("#formTitle").textContent = `${record ? "Edit" : "Add"} ${labels[collection]}`;
  $("#formFields").innerHTML = fields(collection, record);
  $("#recordForm").dataset.collection = collection;
  $("#formDialog").showModal();
}

async function load() {
  [state.leads, state.properties, state.documents, state.complianceItems] = await Promise.all([api("leads"), api("properties"), api("documents"), api("complianceItems")]);
  renderLeads(); renderProperties(); renderForms(); renderCompliance(); await renderDashboard();
}

document.addEventListener("click", event => {
  const view = event.target.dataset.view;
  if (view) { document.querySelectorAll(".view, nav button").forEach(el => el.classList.remove("active")); $(`#${view}`).classList.add("active"); document.querySelector(`nav button[data-view="${view}"]`)?.classList.add("active"); $("#title").textContent = titleByView[view]; }
  const filter = event.target.dataset.filter;
  if (filter) { state.activeFilter = filter; renderLeads(); }
  const lead = state.leads.find(item => item.id === event.target.dataset.edit); if (lead) showForm("leads", lead);
  const property = state.properties.find(item => item.id === event.target.dataset.propertyEdit); if (property) showForm("properties", property);
  const form = state.documents.find(item => item.id === event.target.dataset.formEdit); if (form) showForm("documents", form);
  const compliance = state.complianceItems.find(item => item.id === event.target.dataset.complianceEdit); if (compliance) showForm("complianceItems", compliance);
});
$("#newButton").onclick = () => showForm("leads"); $("#addLead").onclick = () => showForm("leads"); $("#addProperty").onclick = () => showForm("properties"); $("#addForm").onclick = () => showForm("documents"); $("#addCompliance").onclick = () => showForm("complianceItems");
$("#closeDialog").onclick = () => $("#formDialog").close(); $("#cancelDialog").onclick = () => $("#formDialog").close();
$("#recordForm").onsubmit = async event => { event.preventDefault(); const form = new FormData(event.currentTarget); const payload = Object.fromEntries(form.entries()); const collection = event.currentTarget.dataset.collection; const url = state.editing ? `/api/${collection}/${state.editing.id}` : `/api/${collection}`; await api(url.slice(5), { method: state.editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); $("#formDialog").close(); await load(); };
$("#today").textContent = new Intl.DateTimeFormat("en-CA", { weekday:"long", month:"long", day:"numeric" }).format(new Date());
load().catch(error => { document.body.insertAdjacentHTML("beforeend", `<p class="error">${error.message}</p>`); });
