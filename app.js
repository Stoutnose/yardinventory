// ===============================
// SURYA PARKING YARD - FULL APP
// ===============================

// ---------------- STORAGE ----------------
const KEY = "sp_inventory_records_v2";

function loadRecords(){
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

function saveRecords(records){
  localStorage.setItem(KEY, JSON.stringify(records));
}

function upsertRecord(record){
  const records = loadRecords();
  const index = records.findIndex(r => r.id === record.id);
  if(index >= 0){
    records[index] = record;
  } else {
    records.unshift(record);
  }
  saveRecords(records);
}

function deleteRecord(id){
  const records = loadRecords().filter(r => r.id !== id);
  saveRecords(records);
}

// ---------------- HELPERS ----------------
function $(id){ return document.getElementById(id); }
function val(id){ return $(id)?.value || ""; }
function setVal(id,v){ if($(id)) $(id).value = v || ""; }

function generateInv(){
  const d = new Date();
  return "INV-" + d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate() + "-" + Math.floor(Math.random()*1000);
}

// ---------------- VIEWS ----------------
const dashboardView = $("dashboardView");
const formView = $("formView");

function show(view){
  dashboardView.classList.toggle("hidden", view !== "dash");
  formView.classList.toggle("hidden", view !== "form");
}

// ---------------- FORM ----------------
let currentId = null;

function clearForm(){
  currentId = null;
  setVal("inventoryNo", generateInv());
  ["vehicleNo","customerName","financeName","vehicleType","yardInAt"].forEach(id => setVal(id,""));
}

function getFormData(status){
  return {
    id: currentId || crypto.randomUUID(),
    inventoryNo: val("inventoryNo") || generateInv(),
    vehicleNo: val("vehicleNo"),
    customerName: val("customerName"),
    vehicleType: val("vehicleType"),
    financeName: val("financeName"),
    yardInAt: val("yardInAt"),
    accident: val("accidentFlag") || "No",
    keyAvailable: $("keyEngine")?.checked || false,
    status: status,
    updatedAt: new Date().toISOString()
  };
}

function fillForm(r){
  currentId = r.id;
  setVal("inventoryNo", r.inventoryNo);
  setVal("vehicleNo", r.vehicleNo);
  setVal("customerName", r.customerName);
  setVal("vehicleType", r.vehicleType);
  setVal("financeName", r.financeName);
  setVal("yardInAt", r.yardInAt);
  setVal("accidentFlag", r.accident);
  if($("keyEngine")) $("keyEngine").checked = r.keyAvailable;
}

// ---------------- DASHBOARD ----------------
function computeStats(records){
  return {
    total: records.length,
    draft: records.filter(r=>r.status==="Draft").length,
    submitted: records.filter(r=>r.status==="Submitted").length,
    noKey: records.filter(r=>!r.keyAvailable).length,
    accident: records.filter(r=>r.accident==="Yes").length
  };
}

function buildTable(records){
  if(!records.length){
    return `<tr><td colspan="6">No Records</td></tr>`;
  }

  return `
    <tr>
      <th>Vehicle</th>
      <th>Type</th>
      <th>Finance</th>
      <th>Status</th>
      <th>Key</th>
      <th>Accident</th>
    </tr>
    ${records.map(r=>`
      <tr>
        <td>${r.vehicleNo}</td>
        <td>${r.vehicleType}</td>
        <td>${r.financeName}</td>
        <td>${r.status}</td>
        <td>${r.keyAvailable ? "Yes" : "No"}</td>
        <td>${r.accident}</td>
      </tr>
    `).join("")}
  `;
}

function renderDashboard(){
  const records = loadRecords();
  const stats = computeStats(records);

  $("kpiRow").innerHTML = `
    <div class="kpi">Total: ${stats.total}</div>
    <div class="kpi">Draft: ${stats.draft}</div>
    <div class="kpi">Submitted: ${stats.submitted}</div>
    <div class="kpi">No Key: ${stats.noKey}</div>
    <div class="kpi">Accident: ${stats.accident}</div>
  `;

  $("viewAllTable").innerHTML = buildTable(records);
}

function refreshAll(){
  renderDashboard();
}

// ---------------- SEARCH ----------------
function runSearch(){
  const q = $("searchInput").value.toLowerCase();
  const records = loadRecords().filter(r =>
    r.vehicleNo.toLowerCase().includes(q) ||
    r.customerName.toLowerCase().includes(q)
  );
  $("searchTable").innerHTML = buildTable(records);
}

// ---------------- FILTER ----------------
function runFilter(){
  const type = $("filterType").value;
  const status = $("filterStatus")?.value;

  let records = loadRecords();

  if(type){
    records = records.filter(r=>r.vehicleType===type);
  }

  if(status){
    records = records.filter(r=>r.status===status);
  }

  $("filterTable").innerHTML = buildTable(records);
}

// ---------------- EXPORT ----------------
function exportCSV(){
  const records = loadRecords();
  const csv = [
    "Vehicle,Type,Finance,Status",
    ...records.map(r=>`${r.vehicleNo},${r.vehicleType},${r.financeName},${r.status}`)
  ].join("\n");

  const blob = new Blob([csv],{type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "vehicles.csv";
  a.click();
}

// ---------------- EVENTS ----------------
$("btnNew").onclick = ()=>{
  clearForm();
  show("form");
};

$("btnDashboard").onclick = ()=>{
  show("dash");
  refreshAll();
};

$("btnSaveDraft").onclick = ()=>{
  const rec = getFormData("Draft");
  upsertRecord(rec);
  show("dash");
  refreshAll();
};

$("btnSubmit").onclick = ()=>{
  const rec = getFormData("Submitted");
  upsertRecord(rec);
  show("dash");
  refreshAll();
};

$("btnDelete").onclick = ()=>{
  if(!currentId) return;
  deleteRecord(currentId);
  show("dash");
  refreshAll();
};

$("btnDoSearch").onclick = runSearch;
$("btnApplyFilter").onclick = runFilter;
$("btnDownloadExcel").onclick = exportCSV;

// ---------------- INIT ----------------
show("dash");
refreshAll();
