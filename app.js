// Views
const dashboardView = document.getElementById("dashboardView");
const formView = document.getElementById("formView");

// Top buttons
const btnDashboard = document.getElementById("btnDashboard");
const btnNew = document.getElementById("btnNew");
const btnPrint = document.getElementById("btnPrint");

// Dashboard controls
const recordsList = document.getElementById("recordsList");
const searchBox = document.getElementById("searchBox");
const statusFilter = document.getElementById("statusFilter");
const btnExport = document.getElementById("btnExport");
const btnClearAll = document.getElementById("btnClearAll");

// Form buttons
const btnSaveDraft = document.getElementById("btnSaveDraft");
const btnSubmit = document.getElementById("btnSubmit");
const btnCancel = document.getElementById("btnCancel");
const btnDelete = document.getElementById("btnDelete");

// Status + inventory
const statusBadge = document.getElementById("statusBadge");
const inventoryNo = document.getElementById("inventoryNo");

// Branch UI
const branchSelect = document.getElementById("branchSelect");
const brandTitle = document.getElementById("brandTitle");
const brandSub = document.getElementById("brandSub");
const slotNoteEl = document.getElementById("slotNote");
const formBranch = document.getElementById("formBranch");

// Photos
const photoType = document.getElementById("photoType");
const photoFiles = document.getElementById("photoFiles");
const btnAddPhotos = document.getElementById("btnAddPhotos");
const btnClearPhotos = document.getElementById("btnClearPhotos");
const photoGrid = document.getElementById("photoGrid");

// Signatures
const sigName1 = document.getElementById("sigName1");
const sigName2 = document.getElementById("sigName2");
const sigName3 = document.getElementById("sigName3");
const sigCanvas1 = document.getElementById("sigCanvas1");
const sigCanvas2 = document.getElementById("sigCanvas2");
const sigCanvas3 = document.getElementById("sigCanvas3");
const btnClearSig1 = document.getElementById("btnClearSig1");
const btnClearSig2 = document.getElementById("btnClearSig2");
const btnClearSig3 = document.getElementById("btnClearSig3");

// Helpers
function byId(id){ return document.getElementById(id); }
function getVal(id){ return byId(id)?.value ?? ""; }
function setVal(id, v){ const el = byId(id); if(el) el.value = v ?? ""; }
function getChecked(id){ const el = byId(id); return el ? !!el.checked : false; }
function setChecked(id, v){ const el = byId(id); if(el) el.checked = !!v; }
function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, (ch) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[ch]));
}

// -------------------- Branch config (EDIT YOUR 3 BRANCHES HERE) --------------------
const BRANCHES = [
  { id:"HN", name:"Hayath Nagar (Main)", occupiedRanges:[[1,3],[11,15],[30,35],[50,61]] },
  { id:"KP", name:"Kukatpally",         occupiedRanges:[[2,4],[12,14],[33,36],[55,60]] },
  { id:"GB", name:"Gachibowli",         occupiedRanges:[[1,2],[11,13],[31,34],[52,58]] },
];

function getBranchConfig(id){
  const bid = id || getBranchId();
  return BRANCHES.find(b => b.id === bid) || BRANCHES[0];
}
function formatRanges(ranges){
  return (ranges || []).map(([a,b]) => (a===b ? String(a) : `${a}–${b}`)).join(", ");
}

function applyBranchUI(){
  const b = getBranchConfig();
  if(brandTitle) brandTitle.textContent = `Surya Parking Yard - Inventory • ${b.name}`;
  if(brandSub) brandSub.textContent = "PDF-style form UI (Demo)";
  document.title = `Surya Parking Yard - Vehicle Inventory • ${b.name}`;

  if(slotNoteEl){
    slotNoteEl.innerHTML = `
      <b>Reserved:</b> 1–10 Cycles, 11–30 3 Wheelers, 31–50 Passenger Vehicles, 51–100 Cars
      <span class="dot">•</span>
      <b>Occupied:</b> ${formatRanges(b.occupiedRanges)}
    `;
  }
}

function populateBranchSelects(){
  const opts = BRANCHES.map(b => `<option value="${b.id}">${b.name}</option>`).join("");

  if(branchSelect){
    branchSelect.innerHTML = opts;
    branchSelect.value = getBranchId();
  }
  if(formBranch){
    formBranch.innerHTML = opts;
    formBranch.value = getBranchId();
  }
}

// Init branch dropdowns
populateBranchSelects();
applyBranchUI();

// Switch dashboard branch
if(branchSelect){
  branchSelect.addEventListener("change", () => {
    setBranchId(branchSelect.value);
    applyBranchUI();
    renderList();
    renderParkingSlots();
    show("dash");
  });
}

// -------------------- Views --------------------
let currentId = null;
let currentPhotos = [];

function show(view){
  dashboardView.classList.toggle("hidden", view !== "dash");
  formView.classList.toggle("hidden", view !== "form");
  window.scrollTo({top:0, behavior:"smooth"});
}

btnDashboard.onclick = () => show("dash");
btnNew.onclick = () => openNew();
btnPrint.onclick = () => window.print();

// -------------------- Inventory No generator --------------------
function pad2(n){ return String(n).padStart(2,"0"); }
function newInventoryNo() {
  const d = new Date();
  return `INV-${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-${Math.floor(Math.random()*9000+1000)}`;
}
function setStatusUI(status){ statusBadge.textContent = status; }

// -------------------- Signature pad --------------------
function initSignaturePad(canvas){
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(10,83,168,0.95)";

  const pad = { drawing:false, last:null };

  function pos(e){
    const rect = canvas.getBoundingClientRect();
    const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
    const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return {x,y};
  }

  function start(e){ e.preventDefault(); pad.drawing = true; pad.last = pos(e); }
  function move(e){
    if(!pad.drawing) return;
    e.preventDefault();
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(pad.last.x, pad.last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    pad.last = p;
  }
  function end(e){
    if(!pad.drawing) return;
    e.preventDefault();
    pad.drawing = false;
    pad.last = null;
  }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);

  canvas.addEventListener("touchstart", start, {passive:false});
  canvas.addEventListener("touchmove", move, {passive:false});
  window.addEventListener("touchend", end, {passive:false});
}

function clearCanvas(canvas){
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);
}
function canvasToDataUrl(canvas){ return canvas.toDataURL("image/png"); }
function dataUrlToCanvas(canvas, dataUrl){
  if(!dataUrl) return;
  const img = new Image();
  img.onload = () => {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = dataUrl;
}

// init pads
initSignaturePad(sigCanvas1);
initSignaturePad(sigCanvas2);
initSignaturePad(sigCanvas3);
btnClearSig1.onclick = () => clearCanvas(sigCanvas1);
btnClearSig2.onclick = () => clearCanvas(sigCanvas2);
btnClearSig3.onclick = () => clearCanvas(sigCanvas3);

// -------------------- Photos (multi upload) --------------------
async function fileToDataUrl(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderPhotos(){
  if(!photoGrid) return;
  photoGrid.innerHTML = "";

  if(!currentPhotos.length){
    photoGrid.innerHTML = `<div class="meta">No photos added.</div>`;
    return;
  }

  currentPhotos.forEach(p => {
    const div = document.createElement("div");
    div.className = "photo-card";
    div.innerHTML = `
      <img src="${p.dataUrl}" alt="${escapeHtml(p.type)}">
      <div class="photo-meta">
        <div>
          <div class="type">${escapeHtml(p.type)}</div>
          <div class="meta">${new Date(p.createdAt).toLocaleString()}</div>
        </div>
        <button class="danger" data-id="${p.id}">Remove</button>
      </div>
    `;
    div.querySelector("button").onclick = () => {
      currentPhotos = currentPhotos.filter(x => x.id !== p.id);
      renderPhotos();
    };
    photoGrid.appendChild(div);
  });
}

if(btnAddPhotos){
  btnAddPhotos.onclick = async () => {
    const files = Array.from(photoFiles.files || []);
    if(!files.length) return alert("Choose photo(s) first.");

    // Hard cap for demo localStorage stability
    if(files.some(f => f.size > 2_500_000)) {
      return alert("One of the photos is too large for demo storage (keep each image under ~2.5MB).");
    }

    const type = photoType.value;
    for(const f of files){
      const dataUrl = await fileToDataUrl(f);
      currentPhotos.push({
        id: crypto.randomUUID(),
        type,
        fileName: f.name,
        dataUrl,
        createdAt: new Date().toISOString()
      });
    }
    photoFiles.value = "";
    renderPhotos();
  };
}

if(btnClearPhotos){
  btnClearPhotos.onclick = () => {
    if(!currentPhotos.length) return;
    if(!confirm("Remove all photos from this inventory?")) return;
    currentPhotos = [];
    renderPhotos();
  };
}

// -------------------- Form reset --------------------
const CHECKLIST_IDS = [
  "chkFenders","chkHeadLights","chkParkLights","chkHorn","chkSideLights","chkFrontBumper","chkRadiatorCap","chkWindshield","chkWiper",
  "chkTankCap","chkRearBumper","chkRearLights","chkTrapalin",
  "chkDoorHandles","chkDoorGlass","chkInstrumentPanel","chkSpeedometer","chkRearViewMirror","chkCeilingLights","chkRubberMats",
  "chkMudguard","chkMudLamp","chkSunVisor","chkStepneyWheel","chkTVLCD","chkCDDVD",
  "chkAmplifier","chkSelfStarter","chkAlternator","chkWheelSpanner","chkAntenna","chkAC","chkCentralLock","chkBadges","chkLuggageCarrier"
];

function clearFormToBlankNew(){
  [
    "slNo","inventoryDate","agreementNo","financeName","customerName","customerAddress",
    "repoAgencyName","seizedAt","yardInAt","vehicleNo","make","model","mfgYear",
    "engineNo","chassisNo","odometerKm","fuelPct","notes",
    "docRCNote","docTaxNote","docPermitNote","docInsuranceNote",
    "tyreFLMake","tyreFLSize","tyreFLNo",
    "tyreFRMake","tyreFRSize","tyreFRNo",
    "tyreRLMake","tyreRLSize","tyreRLNo",
    "tyreRRMake","tyreRRSize","tyreRRNo",
    "tyreSPMake","tyreSPSize","tyreSPNo",
    "keyOtherNote",
    "batteryMake","batteryNo"
  ].forEach(id => setVal(id, ""));

  setVal("vehicleType", "2W");
  setVal("tyreFLType", "Original");
  setVal("tyreFRType", "Original");
  setVal("tyreRLType", "Original");
  setVal("tyreRRType", "Original");
  setVal("tyreSPType", "Original");

  setVal("batteryCondition", "");
  setVal("engineStatus", "");
  setVal("accidentFlag", "No");
  setVal("towingFlag", "No");

  ["docRC","docTax","docPermit","docInsurance"].forEach(id => setChecked(id, false));
  CHECKLIST_IDS.forEach(id => setChecked(id, false));
  ["keyEngine","keyDoor","keyDslTank","keyOther"].forEach(id => setChecked(id, false));

  sigName1.value = "";
  sigName2.value = "";
  sigName3.value = "";
  clearCanvas(sigCanvas1);
  clearCanvas(sigCanvas2);
  clearCanvas(sigCanvas3);

  // NEW: Default branch in form = current dashboard branch
  if(formBranch) formBranch.value = getBranchId();

  currentPhotos = [];
  renderPhotos();

  inventoryNo.value = newInventoryNo();
  setStatusUI("Draft");
}

// -------------------- Collect + Fill --------------------
function collectForm(){
  const branchId = formBranch ? formBranch.value : getBranchId();

  return {
    id: currentId || crypto.randomUUID(),
    branchId,

    slNo: getVal("slNo"),
    inventoryNo: getVal("inventoryNo"),
    inventoryDate: getVal("inventoryDate"),
    agreementNo: getVal("agreementNo"),
    financeName: getVal("financeName"),
    customerName: getVal("customerName"),
    customerAddress: getVal("customerAddress"),
    repoAgencyName: getVal("repoAgencyName"),
    seizedAt: getVal("seizedAt"),
    yardInAt: getVal("yardInAt"),
    vehicleType: getVal("vehicleType"),
    vehicleNo: getVal("vehicleNo"),
    make: getVal("make"),
    model: getVal("model"),
    mfgYear: getVal("mfgYear"),
    engineNo: getVal("engineNo"),
    chassisNo: getVal("chassisNo"),
    odometerKm: getVal("odometerKm"),
    fuelPct: getVal("fuelPct"),
    notes: getVal("notes"),

    documents: {
      rc: { received: getChecked("docRC"), note: getVal("docRCNote") },
      tax: { received: getChecked("docTax"), note: getVal("docTaxNote") },
      permit: { received: getChecked("docPermit"), note: getVal("docPermitNote") },
      insurance: { received: getChecked("docInsurance"), note: getVal("docInsuranceNote") }
    },

    tyres: {
      fl: { make:getVal("tyreFLMake"), size:getVal("tyreFLSize"), no:getVal("tyreFLNo"), type:getVal("tyreFLType") },
      fr: { make:getVal("tyreFRMake"), size:getVal("tyreFRSize"), no:getVal("tyreFRNo"), type:getVal("tyreFRType") },
      rl: { make:getVal("tyreRLMake"), size:getVal("tyreRLSize"), no:getVal("tyreRLNo"), type:getVal("tyreRLType") },
      rr: { make:getVal("tyreRRMake"), size:getVal("tyreRRSize"), no:getVal("tyreRRNo"), type:getVal("tyreRRType") },
      sp: { make:getVal("tyreSPMake"), size:getVal("tyreSPSize"), no:getVal("tyreSPNo"), type:getVal("tyreSPType") }
    },

    checklist: Object.fromEntries(CHECKLIST_IDS.map(id => [id, getChecked(id)])),

    condition: {
      batteryMake: getVal("batteryMake"),
      batteryNo: getVal("batteryNo"),
      batteryCondition: getVal("batteryCondition"),
      engineStatus: getVal("engineStatus"),
      accident: getVal("accidentFlag"),
      towing: getVal("towingFlag"),
      keys: {
        engineKey: getChecked("keyEngine"),
        doorKey: getChecked("keyDoor"),
        dslTankKey: getChecked("keyDslTank"),
        otherKey: getChecked("keyOther"),
        otherNote: getVal("keyOtherNote")
      }
    },

    photos: currentPhotos,

    signatures: {
      surrender: { name: sigName1.value, image: canvasToDataUrl(sigCanvas1) },
      yard: { name: sigName2.value, image: canvasToDataUrl(sigCanvas2) },
      godown: { name: sigName3.value, image: canvasToDataUrl(sigCanvas3) }
    }
  };
}

function fillForm(r){
  if(formBranch) formBranch.value = r.branchId || getBranchId();

  setVal("slNo", r.slNo);
  setVal("inventoryNo", r.inventoryNo);
  setVal("inventoryDate", r.inventoryDate);
  setVal("agreementNo", r.agreementNo);
  setVal("financeName", r.financeName);
  setVal("customerName", r.customerName);
  setVal("customerAddress", r.customerAddress);
  setVal("repoAgencyName", r.repoAgencyName);
  setVal("seizedAt", r.seizedAt);
  setVal("yardInAt", r.yardInAt);
  setVal("vehicleType", r.vehicleType || "2W");
  setVal("vehicleNo", r.vehicleNo);
  setVal("make", r.make);
  setVal("model", r.model);
  setVal("mfgYear", r.mfgYear);
  setVal("engineNo", r.engineNo);
  setVal("chassisNo", r.chassisNo);
  setVal("odometerKm", r.odometerKm);
  setVal("fuelPct", r.fuelPct);
  setVal("notes", r.notes);

  setChecked("docRC", !!r.documents?.rc?.received); setVal("docRCNote", r.documents?.rc?.note);
  setChecked("docTax", !!r.documents?.tax?.received); setVal("docTaxNote", r.documents?.tax?.note);
  setChecked("docPermit", !!r.documents?.permit?.received); setVal("docPermitNote", r.documents?.permit?.note);
  setChecked("docInsurance", !!r.documents?.insurance?.received); setVal("docInsuranceNote", r.documents?.insurance?.note);

  setVal("tyreFLMake", r.tyres?.fl?.make); setVal("tyreFLSize", r.tyres?.fl?.size); setVal("tyreFLNo", r.tyres?.fl?.no); setVal("tyreFLType", r.tyres?.fl?.type || "Original");
  setVal("tyreFRMake", r.tyres?.fr?.make); setVal("tyreFRSize", r.tyres?.fr?.size); setVal("tyreFRNo", r.tyres?.fr?.no); setVal("tyreFRType", r.tyres?.fr?.type || "Original");
  setVal("tyreRLMake", r.tyres?.rl?.make); setVal("tyreRLSize", r.tyres?.rl?.size); setVal("tyreRLNo", r.tyres?.rl?.no); setVal("tyreRLType", r.tyres?.rl?.type || "Original");
  setVal("tyreRRMake", r.tyres?.rr?.make); setVal("tyreRRSize", r.tyres?.rr?.size); setVal("tyreRRNo", r.tyres?.rr?.no); setVal("tyreRRType", r.tyres?.rr?.type || "Original");
  setVal("tyreSPMake", r.tyres?.sp?.make); setVal("tyreSPSize", r.tyres?.sp?.size); setVal("tyreSPNo", r.tyres?.sp?.no); setVal("tyreSPType", r.tyres?.sp?.type || "Original");

  CHECKLIST_IDS.forEach(id => setChecked(id, !!r.checklist?.[id]));

  setVal("batteryMake", r.condition?.batteryMake);
  setVal("batteryNo", r.condition?.batteryNo);
  setVal("batteryCondition", r.condition?.batteryCondition || "");
  setVal("engineStatus", r.condition?.engineStatus || "");
  setVal("accidentFlag", r.condition?.accident || "No");
  setVal("towingFlag", r.condition?.towing || "No");

  setChecked("keyEngine", !!r.condition?.keys?.engineKey);
  setChecked("keyDoor", !!r.condition?.keys?.doorKey);
  setChecked("keyDslTank", !!r.condition?.keys?.dslTankKey);
  setChecked("keyOther", !!r.condition?.keys?.otherKey);
  setVal("keyOtherNote", r.condition?.keys?.otherNote || "");

  currentPhotos = r.photos || [];
  renderPhotos();

  sigName1.value = r.signatures?.surrender?.name || "";
  sigName2.value = r.signatures?.yard?.name || "";
  sigName3.value = r.signatures?.godown?.name || "";

  dataUrlToCanvas(sigCanvas1, r.signatures?.surrender?.image);
  dataUrlToCanvas(sigCanvas2, r.signatures?.yard?.image);
  dataUrlToCanvas(sigCanvas3, r.signatures?.godown?.image);
}

// -------------------- Open New / Edit --------------------
function openNew(){
  currentId = null;
  clearFormToBlankNew();
  show("form");
}

function openEdit(id){
  // search across ALL branches to find the record
  let found = null;
  let foundBranch = null;

  for(const b of BRANCHES){
    const list = loadRecords(b.id);
    const r = list.find(x => x.id === id);
    if(r){ found = r; foundBranch = b.id; break; }
  }
  if(!found) return;

  currentId = found.id;
  fillForm(found);
  setStatusUI(found.status || "Draft");
  show("form");

  // Keep dashboard branch where the record belongs
  if(foundBranch){
    setBranchId(foundBranch);
    if(branchSelect) branchSelect.value = foundBranch;
    applyBranchUI();
  }
}

// -------------------- Dashboard list --------------------
function renderList(){
  const branchId = getBranchId();
  const q = (searchBox?.value || "").trim().toLowerCase();
  const f = statusFilter?.value || "ALL";

  const records = loadRecords(branchId);

  const filtered = records.filter(r => {
    if(f !== "ALL" && (r.status || "Draft") !== f) return false;
    if(!q) return true;
    return (
      (r.inventoryNo || "").toLowerCase().includes(q) ||
      (r.vehicleNo || "").toLowerCase().includes(q) ||
      (r.customerName || "").toLowerCase().includes(q) ||
      (r.financeName || "").toLowerCase().includes(q) ||
      (r.agreementNo || "").toLowerCase().includes(q)
    );
  });

  recordsList.innerHTML = "";
  if(!filtered.length){
    recordsList.innerHTML = `<div class="meta">No records found for this branch.</div>`;
    return;
  }

  filtered.forEach(r => {
    const st = (r.status || "Draft");
    const div = document.createElement("div");
    div.className = "record";
    div.innerHTML = `
      <div class="left">
        <strong>${escapeHtml(r.inventoryNo || "-")}</strong>
        <div class="meta">${escapeHtml(r.vehicleNo || "-")} • ${escapeHtml(r.customerName || "-")} • ${escapeHtml(r.financeName || "-")}</div>
      </div>
      <div class="right">
        <span class="pill ${st === "Submitted" ? "sub" : "draft"}">${escapeHtml(st)}</span>
        <button class="ghost" data-edit="${r.id}">Open</button>
      </div>
    `;
    div.querySelector("[data-edit]").onclick = () => openEdit(r.id);
    recordsList.appendChild(div);
  });
}

if(searchBox) searchBox.addEventListener("input", renderList);
if(statusFilter) statusFilter.addEventListener("change", renderList);

btnExport.onclick = () => {
  const branchId = getBranchId();
  const blob = new Blob([JSON.stringify(loadRecords(branchId), null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `surya-inventory-${branchId}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

btnClearAll.onclick = () => {
  const branchId = getBranchId();
  if(!confirm(`Clear ALL records for ${getBranchConfig(branchId).name}?`)) return;
  clearAllRecords(branchId);
  renderList();
};

// -------------------- Form actions --------------------
btnCancel.onclick = () => show("dash");

function saveWithStatus(status){
  const r = collectForm();
  r.status = status;
  r.updatedAt = new Date().toISOString();

  // IMPORTANT: Save to selected branch
  const targetBranch = r.branchId;

  upsertRecord(r, targetBranch);
  currentId = r.id;
  setStatusUI(status);

  // After save/submit -> switch dashboard to that branch so user sees it
  setBranchId(targetBranch);
  if(branchSelect) branchSelect.value = targetBranch;
  applyBranchUI();

  renderList();
  renderParkingSlots();
  show("dash");
}

btnSaveDraft.onclick = () => saveWithStatus("Draft");
btnSubmit.onclick = () => saveWithStatus("Submitted");

btnDelete.onclick = () => {
  if(!currentId) return alert("Nothing to delete.");

  const b = formBranch ? formBranch.value : getBranchId();
  if(!confirm("Delete this record?")) return;

  deleteRecord(currentId, b);
  currentId = null;

  // go to that branch dashboard
  setBranchId(b);
  if(branchSelect) branchSelect.value = b;
  applyBranchUI();

  renderList();
  show("dash");
};

// -------------------- Parking Slots (per branch) --------------------
const PARKING_RULES = [
  { from: 1,  to: 10,  type: "Cycle" },
  { from: 11, to: 30,  type: "3 Wheeler" },
  { from: 31, to: 50,  type: "Passenger Vehicle" },
  { from: 51, to: 100, type: "Car" },
];

function slotTypeFor(n){
  for(const r of PARKING_RULES){
    if(n >= r.from && n <= r.to) return r.type;
  }
  return "Unknown";
}
function rangeSet(ranges){
  const set = new Set();
  (ranges || []).forEach(([a,b]) => {
    for(let i=a; i<=b; i++) set.add(i);
  });
  return set;
}
function buildAllSlots(occupiedRanges){
  const occupiedSet = rangeSet(occupiedRanges);
  const out = [];
  for(let n=1; n<=100; n++){
    const type = slotTypeFor(n);
    const occupied = occupiedSet.has(n);
    out.push({
      slot: n,
      reservedFor: type,
      status: occupied ? "Occupied" : "Vacant",
      description: occupied ? `Occupied - ${type}` : `Vacant - ${type} slot`
    });
  }
  return out;
}
let __slotsCache = null;
let __slotsCacheBranch = null;

function getAllSlots(){
  const b = getBranchId();
  if(!__slotsCache || __slotsCacheBranch !== b){
    __slotsCache = buildAllSlots(getBranchConfig(b).occupiedRanges || []);
    __slotsCacheBranch = b;
  }
  return __slotsCache;
}

function renderParkingSlots(){
  const ALL_SLOTS = getAllSlots();
  const vacantBody = byId("vacantSlotsBody");
  const occupiedBody = byId("occupiedSlotsBody");
  if(!vacantBody || !occupiedBody) return;

  const slotSearch = byId("slotSearch");
  const slotTypeFilter = byId("slotTypeFilter");
  const slotStatusFilter = byId("slotStatusFilter");

  const q = (slotSearch?.value || "").trim().toLowerCase();
  const type = slotTypeFilter?.value || "ALL";
  const status = slotStatusFilter?.value || "ALL";

  const filtered = ALL_SLOTS.filter(s => {
    if(type !== "ALL" && s.reservedFor !== type) return false;
    if(status !== "ALL" && s.status !== status) return false;
    if(!q) return true;
    return String(s.slot).includes(q)
      || s.reservedFor.toLowerCase().includes(q)
      || s.status.toLowerCase().includes(q);
  });

  const vacant = filtered.filter(s => s.status === "Vacant");
  const occupied = filtered.filter(s => s.status === "Occupied");

  const totalOccupied = ALL_SLOTS.filter(s => s.status === "Occupied").length;
  const totalVacant = ALL_SLOTS.filter(s => s.status === "Vacant").length;

  const statOccupied = byId("statOccupied");
  const statVacant = byId("statVacant");
  const statFiltered = byId("statFiltered");
  if(statOccupied) statOccupied.textContent = totalOccupied;
  if(statVacant) statVacant.textContent = totalVacant;
  if(statFiltered) statFiltered.textContent = filtered.length;

  vacantBody.innerHTML = vacant.length
    ? vacant.map(s => `
      <tr>
        <td><b>${s.slot}</b></td>
        <td>${escapeHtml(s.reservedFor)}</td>
        <td><span class="slot-pill vacant">Vacant</span></td>
      </tr>
    `).join("")
    : `<tr><td colspan="3" class="meta">No vacant slots for current filters.</td></tr>`;

  occupiedBody.innerHTML = occupied.length
    ? occupied.map(s => `
      <tr>
        <td><b>${s.slot}</b></td>
        <td>${escapeHtml(s.reservedFor)}</td>
        <td><span class="slot-pill occupied">${escapeHtml(s.description)}</span></td>
      </tr>
    `).join("")
    : `<tr><td colspan="3" class="meta">No occupied slots for current filters.</td></tr>`;
}

// parking controls
(function initParkingUI(){
  const slotSearch = byId("slotSearch");
  const slotTypeFilter = byId("slotTypeFilter");
  const slotStatusFilter = byId("slotStatusFilter");
  const btnResetSlots = byId("btnResetSlots");

  if(slotSearch) slotSearch.addEventListener("input", renderParkingSlots);
  if(slotTypeFilter) slotTypeFilter.addEventListener("change", renderParkingSlots);
  if(slotStatusFilter) slotStatusFilter.addEventListener("change", renderParkingSlots);

  if(btnResetSlots){
    btnResetSlots.onclick = () => {
      if(slotSearch) slotSearch.value = "";
      if(slotTypeFilter) slotTypeFilter.value = "ALL";
      if(slotStatusFilter) slotStatusFilter.value = "ALL";
      renderParkingSlots();
    };
  }
})();

// -------------------- Boot --------------------
renderList();
renderParkingSlots();
show("dash");
