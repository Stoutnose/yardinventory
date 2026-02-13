// =======================================================
// SURYA PARKING YARD – FULL PROFESSIONAL INVENTORY SYSTEM
// =======================================================

const STORAGE_KEY = "surya_parking_inventory_v4";

// ===================== STORAGE =====================
function loadRecords(){
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecords(records){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function upsertRecord(record){
  const records = loadRecords();
  const index = records.findIndex(r => r.id === record.id);
  if(index >= 0) records[index] = record;
  else records.unshift(record);
  saveRecords(records);
}

function deleteRecord(id){
  const records = loadRecords().filter(r => r.id !== id);
  saveRecords(records);
}

function clearAllRecords(){
  localStorage.removeItem(STORAGE_KEY);
}

// ===================== HELPERS =====================
function byId(id){ return document.getElementById(id); }
function getVal(id){ return byId(id)?.value ?? ""; }
function setVal(id,v){ const el = byId(id); if(el) el.value = v ?? ""; }
function getChecked(id){ return byId(id)?.checked ?? false; }
function setChecked(id,v){ const el = byId(id); if(el) el.checked = !!v; }

// ===================== VIEW SWITCH =====================
function show(view){
  const dash = byId("dashboardView");
  const form = byId("formView");
  if(dash) dash.classList.toggle("hidden", view !== "dash");
  if(form) form.classList.toggle("hidden", view !== "form");
}

// ===================== INVENTORY NO =====================
function pad2(n){ return String(n).padStart(2,"0"); }
function newInventoryNo(){
  const d = new Date();
  return `INV-${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-${Math.floor(Math.random()*9000+1000)}`;
}

// ===================== GLOBAL STATE =====================
let currentId = null;
let currentPhotos = [];

// ===================== RECORD MAP =====================
function getRecordFromForm(status){
  return {
    id: currentId || crypto.randomUUID(),
    inventoryNo: getVal("inventoryNo") || newInventoryNo(),
    vehicleNo: getVal("vehicleNo"),
    customerName: getVal("customerName"),
    financeName: getVal("financeName"),
    vehicleType: getVal("vehicleType"),
    agreementNo: getVal("agreementNo"),
    status,
    updatedAt: new Date().toISOString()
  };
}

function fillForm(r){
  currentId = r.id || null;

  setVal("inventoryNo", r.inventoryNo);
  setVal("vehicleNo", r.vehicleNo);
  setVal("customerName", r.customerName);
  setVal("financeName", r.financeName);
  setVal("vehicleType", r.vehicleType);
  setVal("agreementNo", r.agreementNo);
}

// ===================== DASHBOARD LIST =====================
function renderList(){

  const searchBox = byId("searchBox");
  const statusFilter = byId("statusFilter");
  const recordsList = byId("recordsList");

  if(!recordsList) return;

  const q = (searchBox?.value || "").toLowerCase();
  const status = statusFilter?.value || "ALL";

  const records = loadRecords().filter(r => {

    if(status !== "ALL" && r.status !== status) return false;

    if(!q) return true;

    const hay = [
      r.inventoryNo,
      r.vehicleNo,
      r.customerName,
      r.financeName,
      r.agreementNo
    ].join(" ").toLowerCase();

    return hay.includes(q);
  });

  recordsList.innerHTML = "";

  if(!records.length){
    recordsList.innerHTML = `<div class="meta">No records found.</div>`;
    return;
  }

  records.forEach(r => {

    const div = document.createElement("div");
    div.className = "record";

    const pillClass = r.status === "Submitted" ? "sub" : "draft";

    div.innerHTML = `
      <div class="left">
        <strong>${r.inventoryNo}</strong>
        <div class="meta">
          ${r.vehicleNo} • ${r.vehicleType} • ${r.customerName}
        </div>
      </div>
      <div class="right">
        <span class="pill ${pillClass}">${r.status}</span>
        <button class="primary">Open</button>
      </div>
    `;

    div.querySelector("button").onclick = ()=>{
      fillForm(r);
      show("form");
    };

    recordsList.appendChild(div);
  });
}

// ===================== VALIDATION =====================
function validateForSubmit(){
  if(!getVal("vehicleNo")) return "Vehicle No is required.";
  if(!getVal("customerName")) return "Customer Name is required.";
  return null;
}

// ===================== EVENTS =====================
document.addEventListener("DOMContentLoaded", ()=>{

  const btnNew = byId("btnNew");
  const btnDashboard = byId("btnDashboard");
  const btnCancel = byId("btnCancel");
  const btnSaveDraft = byId("btnSaveDraft");
  const btnSubmit = byId("btnSubmit");
  const btnDelete = byId("btnDelete");
  const btnExport = byId("btnExport");
  const btnClearAll = byId("btnClearAll");
  const searchBox = byId("searchBox");
  const statusFilter = byId("statusFilter");

  if(btnNew){
    btnNew.onclick = ()=>{
      currentId = null;
      setVal("inventoryNo", newInventoryNo());
      show("form");
    };
  }

  if(btnDashboard){
    btnDashboard.onclick = ()=>{
      renderList();
      show("dash");
    };
  }

  if(btnCancel){
    btnCancel.onclick = ()=>{
      renderList();
      show("dash");
    };
  }

  if(btnSaveDraft){
    btnSaveDraft.onclick = ()=>{
      const rec = getRecordFromForm("Draft");
      upsertRecord(rec);
      renderList();
      show("dash");
    };
  }

  if(btnSubmit){
    btnSubmit.onclick = ()=>{
      const err = validateForSubmit();
      if(err) return alert(err);

      const rec = getRecordFromForm("Submitted");
      upsertRecord(rec);
      renderList();
      show("dash");
    };
  }

  if(btnDelete){
    btnDelete.onclick = ()=>{
      if(!currentId) return alert("Nothing to delete.");
      if(!confirm("Delete this record?")) return;
      deleteRecord(currentId);
      currentId = null;
      renderList();
      show("dash");
    };
  }

  if(btnExport){
    btnExport.onclick = ()=>{
      const blob = new Blob(
        [JSON.stringify(loadRecords(), null, 2)],
        {type:"application/json"}
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "surya-inventory.json";
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  if(btnClearAll){
    btnClearAll.onclick = ()=>{
      if(!confirm("Delete ALL local records?")) return;
      clearAllRecords();
      renderList();
    };
  }

  if(searchBox) searchBox.addEventListener("input", renderList);
  if(statusFilter) statusFilter.addEventListener("change", renderList);

  seedSampleDataIfEmpty();
  renderList();
  show("dash");
});

// ===================== SAMPLE DATA =====================
function seedSampleDataIfEmpty(){

  if(loadRecords().length) return;

  const now = new Date().toISOString();

  saveRecords([
    {
      id:"1",
      inventoryNo:"INV-20250206-1001",
      vehicleNo:"TS09AB1234",
      vehicleType:"SUV",
      customerName:"Ravi Kumar",
      financeName:"Tata Capital Finance Ltd",
      agreementNo:"AG-784512",
      status:"Submitted",
      updatedAt:now
    },
    {
      id:"2",
      inventoryNo:"INV-20250206-1002",
      vehicleNo:"TS10XY5678",
      vehicleType:"2W",
      customerName:"Mahesh Reddy",
      financeName:"Bajaj Finserv",
      agreementNo:"AG-998211",
      status:"Draft",
      updatedAt:now
    }
  ]);
}
