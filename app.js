// ============================
// SAFE INVENTORY SYSTEM
// ============================

const STORAGE_KEY = "surya_inventory_safe";

function loadRecords(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveRecords(records){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
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

// ---------- HELPERS ----------
function $(id){ return document.getElementById(id); }
function safeClick(id, fn){
  const el = $(id);
  if(el) el.onclick = fn;
}

function generateInv(){
  const d = new Date();
  return "INV-" + d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate() + "-" + Math.floor(Math.random()*1000);
}

// ---------- VIEW SWITCH ----------
function show(view){
  if($("dashboardView")) $("dashboardView").classList.toggle("hidden", view !== "dash");
  if($("formView")) $("formView").classList.toggle("hidden", view !== "form");
}

// ---------- FORM ----------
let currentId = null;

function getFormData(status){
  return {
    id: currentId || crypto.randomUUID(),
    inventoryNo: $("inventoryNo")?.value || generateInv(),
    vehicleNo: $("vehicleNo")?.value || "",
    customerName: $("customerName")?.value || "",
    vehicleType: $("vehicleType")?.value || "",
    financeName: $("financeName")?.value || "",
    yardInAt: $("yardInAt")?.value || "",
    status: status,
    updatedAt: new Date().toISOString()
  };
}

function fillForm(r){
  currentId = r.id;
  if($("inventoryNo")) $("inventoryNo").value = r.inventoryNo;
  if($("vehicleNo")) $("vehicleNo").value = r.vehicleNo;
  if($("customerName")) $("customerName").value = r.customerName;
  if($("vehicleType")) $("vehicleType").value = r.vehicleType;
  if($("financeName")) $("financeName").value = r.financeName;
  if($("yardInAt")) $("yardInAt").value = r.yardInAt;
}

// ---------- DASHBOARD ----------
function renderDashboard(){
  const records = loadRecords();

  const recent = $("recentList");
  if(!recent) return;

  recent.innerHTML = "";

  if(records.length === 0){
    recent.innerHTML = "<div style='padding:15px;'>No Records Yet</div>";
    return;
  }

  records.slice(0,5).forEach(r=>{
    const div = document.createElement("div");
    div.className="record";
    div.innerHTML = `
      <div>
        <strong>${r.vehicleNo}</strong>
        <div>${r.customerName} • ${r.financeName}</div>
      </div>
      <button data-id="${r.id}">Open</button>
    `;

    div.querySelector("button").onclick = ()=>{
      fillForm(r);
      show("form");
    };

    recent.appendChild(div);
  });
}

// ---------- EVENTS ----------
safeClick("btnNew", ()=>{
  currentId = null;
  if($("inventoryNo")) $("inventoryNo").value = generateInv();
  show("form");
});

safeClick("btnSaveDraft", ()=>{
  const record = getFormData("Draft");
  upsertRecord(record);
  show("dash");
  renderDashboard();
});

safeClick("btnSubmit", ()=>{
  const record = getFormData("Submitted");
  upsertRecord(record);
  show("dash");
  renderDashboard();
});

safeClick("btnDelete", ()=>{
  if(!currentId) return;
  deleteRecord(currentId);
  show("dash");
  renderDashboard();
});

safeClick("btnDashboard", ()=>{
  show("dash");
  renderDashboard();
});

// ---------- INIT ----------
show("dash");
renderDashboard();
