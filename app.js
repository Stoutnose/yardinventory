// ============================================
// SURYA PARKING YARD – FULL INVENTORY SYSTEM
// ============================================

const STORAGE_KEY = "surya_inventory_v3";

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

// =====================
// HELPERS
// =====================
function $(id){ return document.getElementById(id); }
function val(id){ return $(id)?.value || ""; }
function setVal(id,v){ if($(id)) $(id).value = v || ""; }
function checked(id){ return $(id)?.checked || false; }
function setChecked(id,v){ if($(id)) $(id).checked = v || false; }

function generateInv(){
  const d = new Date();
  return `INV-${d.getFullYear()}${d.getMonth()+1}${d.getDate()}-${Math.floor(Math.random()*1000)}`;
}

// =====================
// VIEW SWITCH
// =====================
function show(view){
  $("dashboardView").classList.toggle("hidden", view !== "dash");
  $("formView").classList.toggle("hidden", view !== "form");
}

// =====================
// FORM SAVE
// =====================
let currentId = null;

function getFormData(status){

  return {
    id: currentId || crypto.randomUUID(),
    inventoryNo: val("inventoryNo") || generateInv(),
    slNo: val("slNo"),
    inventoryDate: val("inventoryDate"),

    agreementNo: val("agreementNo"),
    financeName: val("financeName"),
    customerName: val("customerName"),
    customerAddress: val("customerAddress"),
    repoAgencyName: val("repoAgencyName"),

    seizedAt: val("seizedAt"),
    yardInAt: val("yardInAt"),

    vehicleType: val("vehicleType"),
    vehicleNo: val("vehicleNo"),
    make: val("make"),
    model: val("model"),
    mfgYear: val("mfgYear"),
    engineNo: val("engineNo"),
    chassisNo: val("chassisNo"),

    documents:{
      rc: checked("docRC"),
      tax: checked("docTax"),
      permit: checked("docPermit"),
      insurance: checked("docInsurance")
    },

    condition:{
      batteryMake: val("batteryMake"),
      batteryNo: val("batteryNo"),
      batteryCondition: val("batteryCondition"),
      engineStatus: val("engineStatus"),
      accident: val("accidentFlag"),
      towing: val("towingFlag"),
      keyEngine: checked("keyEngine"),
      keyDoor: checked("keyDoor"),
      keyDslTank: checked("keyDslTank"),
      keyOther: checked("keyOther")
    },

    checklist:{
      chkFenders: checked("chkFenders"),
      chkHeadLights: checked("chkHeadLights"),
      chkHorn: checked("chkHorn")
    },

    status: status,
    updatedAt: new Date().toISOString()
  };
}

// =====================
// LOAD FORM
// =====================
function fillForm(r){

  currentId = r.id;

  setVal("inventoryNo", r.inventoryNo);
  setVal("slNo", r.slNo);
  setVal("inventoryDate", r.inventoryDate);

  setVal("agreementNo", r.agreementNo);
  setVal("financeName", r.financeName);
  setVal("customerName", r.customerName);
  setVal("customerAddress", r.customerAddress);
  setVal("repoAgencyName", r.repoAgencyName);

  setVal("seizedAt", r.seizedAt);
  setVal("yardInAt", r.yardInAt);

  setVal("vehicleType", r.vehicleType);
  setVal("vehicleNo", r.vehicleNo);
  setVal("make", r.make);
  setVal("model", r.model);
  setVal("mfgYear", r.mfgYear);
  setVal("engineNo", r.engineNo);
  setVal("chassisNo", r.chassisNo);

  setChecked("docRC", r.documents?.rc);
  setChecked("docTax", r.documents?.tax);
  setChecked("docPermit", r.documents?.permit);
  setChecked("docInsurance", r.documents?.insurance);

  setVal("batteryMake", r.condition?.batteryMake);
  setVal("batteryNo", r.condition?.batteryNo);
  setVal("batteryCondition", r.condition?.batteryCondition);
  setVal("engineStatus", r.condition?.engineStatus);
  setVal("accidentFlag", r.condition?.accident);
  setVal("towingFlag", r.condition?.towing);

  setChecked("keyEngine", r.condition?.keyEngine);
  setChecked("keyDoor", r.condition?.keyDoor);
  setChecked("keyDslTank", r.condition?.keyDslTank);
  setChecked("keyOther", r.condition?.keyOther);

  setChecked("chkFenders", r.checklist?.chkFenders);
  setChecked("chkHeadLights", r.checklist?.chkHeadLights);
  setChecked("chkHorn", r.checklist?.chkHorn);
}

// =====================
// DASHBOARD
// =====================
function computeStats(records){
  return {
    total: records.length,
    draft: records.filter(r=>r.status==="Draft").length,
    submitted: records.filter(r=>r.status==="Submitted").length
  };
}

function renderDashboard(){

  const records = loadRecords();
  const stats = computeStats(records);

  $("kpiRow").innerHTML = `
    <div class="kpi">Total: ${stats.total}</div>
    <div class="kpi">Draft: ${stats.draft}</div>
    <div class="kpi">Submitted: ${stats.submitted}</div>
  `;

  $("recentList").innerHTML = "";

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

    $("recentList").appendChild(div);
  });
}

// =====================
// EVENTS
// =====================
$("btnNew").onclick = ()=>{
  currentId = null;
  $("inventoryNo").value = generateInv();
  show("form");
};

$("btnSaveDraft").onclick = ()=>{
  const record = getFormData("Draft");
  upsertRecord(record);
  show("dash");
  renderDashboard();
};

$("btnSubmit").onclick = ()=>{
  const record = getFormData("Submitted");
  upsertRecord(record);
  show("dash");
  renderDashboard();
};

$("btnDelete").onclick = ()=>{
  if(!currentId) return;
  deleteRecord(currentId);
  show("dash");
  renderDashboard();
};

$("btnDashboard").onclick = ()=>{
  show("dash");
  renderDashboard();
};

// =====================
// INIT
// =====================
show("dash");
renderDashboard();
