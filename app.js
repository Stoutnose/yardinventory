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

// Analytics (dashboard)
const statTotal = document.getElementById("statTotal");
const stat2W = document.getElementById("stat2W");
const statSUV = document.getElementById("statSUV");
const statLCV = document.getElementById("statLCV");
const resultsMeta = document.getElementById("resultsMeta");

// Lock banner (form)
const lockBanner = document.getElementById("lockBanner");

// Form buttons
const btnSaveDraft = document.getElementById("btnSaveDraft");
const btnSubmit = document.getElementById("btnSubmit");
const btnCancel = document.getElementById("btnCancel");
const btnDelete = document.getElementById("btnDelete");

// Status + inventory
const statusBadge = document.getElementById("statusBadge");
const inventoryNo = document.getElementById("inventoryNo");

// Photos (screen only)
const photoType = document.getElementById("photoType");
const photoFile = document.getElementById("photoFile");
const btnAddPhoto = document.getElementById("btnAddPhoto");
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

// Safe helpers
function byId(id){ return document.getElementById(id); }
function getVal(id){ return byId(id)?.value ?? ""; }
function setVal(id, v){ const el = byId(id); if(el) el.value = v ?? ""; }
function getChecked(id){ const el = byId(id); return el ? !!el.checked : false; }
function setChecked(id, v){ const el = byId(id); if(el) el.checked = !!v; }

let currentId = null;
let currentPhotos = [];

// View switch
function show(view){
  dashboardView.classList.toggle("hidden", view !== "dash");
  formView.classList.toggle("hidden", view !== "form");
  window.scrollTo({top:0, behavior:"smooth"});
}

// Inventory number generator
function pad2(n){ return String(n).padStart(2,"0"); }
function newInventoryNo() {
  const d = new Date();
  return `INV-${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-${Math.floor(Math.random()*9000+1000)}`;
}

function setStatusUI(status){
  statusBadge.textContent = status;
}

function updateStats(allRecords, shownCount){
  if(!Array.isArray(allRecords)) allRecords = [];
  const total = allRecords.length;

  const byType = (t) => allRecords.filter(r => (r.vehicleType || "").toUpperCase() === t).length;

  if(statTotal) statTotal.textContent = total;
  if(stat2W) stat2W.textContent = byType("2W");
  if(statSUV) statSUV.textContent = byType("SUV");
  if(statLCV) statLCV.textContent = byType("LCV");

  if(resultsMeta){
    const sc = typeof shownCount === "number" ? shownCount : total;
    resultsMeta.textContent = total === sc ? `Showing ${sc}` : `Showing ${sc} of ${total}`;
  }
}

function setFormLocked(isLocked){
  document.body.classList.toggle("form-locked", !!isLocked);

  if(lockBanner){
    lockBanner.classList.toggle("hidden", !isLocked);
  }

  // Disable/enable all form inputs
  const inputs = formView.querySelectorAll("input, select, textarea");
  inputs.forEach(el => {
    if(el.id === "inventoryNo") { el.disabled = true; return; } // always disabled
    // allow editing only if unlocked
    el.disabled = !!isLocked;
  });

  // Action buttons
  btnSaveDraft.disabled = !!isLocked;
  btnSubmit.disabled = !!isLocked;
  btnDelete.disabled = !!isLocked;

  // NOTE: signatures & photos are blocked via CSS pointer-events when locked
}

// ---------- Signature pad ----------
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

  function start(e){
    e.preventDefault();
    pad.drawing = true;
    pad.last = pos(e);
  }
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
function canvasToDataUrl(canvas){
  return canvas.toDataURL("image/png");
}
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

// ---------- Photos ----------
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
      <img src="${p.dataUrl}" alt="${p.type}">
      <div class="photo-meta">
        <div>
          <div class="type">${p.type}</div>
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

if(btnAddPhoto){
  btnAddPhoto.onclick = async () => {
    const file = photoFile.files?.[0];
    if(!file) return alert("Choose a photo first.");
    if(file.size > 2_500_000) return alert("Photo too large for demo storage (< ~2.5MB).");
    const dataUrl = await fileToDataUrl(file);
    currentPhotos.push({ id: crypto.randomUUID(), type: photoType.value, dataUrl, createdAt: new Date().toISOString() });
    photoFile.value = "";
    renderPhotos();
  };
}

// ---------- Form reset (IMPORTANT: makes New Inventory empty) ----------
const CHECKLIST_IDS = [
  "chkFenders","chkHeadLights","chkParkLights","chkHorn","chkSideLights","chkFrontBumper","chkRadiatorCap","chkWindshield","chkWiper",
  "chkTankCap","chkRearBumper","chkRearLights","chkTrapalin",
  "chkDoorHandles","chkDoorGlass","chkInstrumentPanel","chkSpeedometer","chkRearViewMirror","chkCeilingLights","chkRubberMats",
  "chkMudguard","chkMudLamp","chkSunVisor","chkStepneyWheel","chkTVLCD","chkCDDVD",
  "chkAmplifier","chkSelfStarter","chkAlternator","chkWheelSpanner","chkAntenna","chkAC","chkCentralLock","chkBadges","chkLuggageCarrier"
];

function clearFormToBlankNew(){
  // basic text/date fields
  [
    "slNo","inventoryDate","agreementNo","financeName","customerName","customerAddress",
    "repoAgencyName","seizedAt","yardInAt","vehicleNo","make","model","mfgYear",
    "engineNo","chassisNo","odometerKm","fuelPct","notes",

    // docs notes
    "docRCNote","docTaxNote","docPermitNote","docInsuranceNote",

    // tyres
    "tyreFLMake","tyreFLSize","tyreFLNo",
    "tyreFRMake","tyreFRSize","tyreFRNo",
    "tyreRLMake","tyreRLSize","tyreRLNo",
    "tyreRRMake","tyreRRSize","tyreRRNo",
    "tyreSPMake","tyreSPSize","tyreSPNo",

    // keys other note
    "keyOtherNote",

    // condition
    "batteryMake","batteryNo"
  ].forEach(id => setVal(id, ""));

  // selects defaults
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

  // docs checkboxes
  setChecked("docRC", false);
  setChecked("docTax", false);
  setChecked("docPermit", false);
  setChecked("docInsurance", false);

  // keys checkboxes
  setChecked("keyEngine", false);
  setChecked("keyDoor", false);
  setChecked("keyDslTank", false);
  setChecked("keyOther", false);

  // checklist checkboxes
  CHECKLIST_IDS.forEach(id => setChecked(id, false));

  // photos
  currentPhotos = [];
  if(photoFile) photoFile.value = "";
  renderPhotos();

  // signatures
  sigName1.value = ""; sigName2.value = ""; sigName3.value = "";
  clearCanvas(sigCanvas1); clearCanvas(sigCanvas2); clearCanvas(sigCanvas3);

  // status & new inventory no
  setStatusUI("Draft");
  setVal("inventoryNo", newInventoryNo());

  // unlocked for new draft
  setFormLocked(false);
}

// ---------- Record mapping ----------
function getChecklist(){
  const out = {};
  CHECKLIST_IDS.forEach(id => out[id] = getChecked(id));
  return out;
}
function setChecklist(obj){
  if(!obj) return;
  Object.keys(obj).forEach(id => setChecked(id, obj[id]));
}

function getRecordFromForm(status){
  return {
    id: currentId || crypto.randomUUID(),

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
      insurance: { received: getChecked("docInsurance"), note: getVal("docInsuranceNote") },
    },

    tyres: {
      fl: { make:getVal("tyreFLMake"), size:getVal("tyreFLSize"), no:getVal("tyreFLNo"), type:getVal("tyreFLType") },
      fr: { make:getVal("tyreFRMake"), size:getVal("tyreFRSize"), no:getVal("tyreFRNo"), type:getVal("tyreFRType") },
      rl: { make:getVal("tyreRLMake"), size:getVal("tyreRLSize"), no:getVal("tyreRLNo"), type:getVal("tyreRLType") },
      rr: { make:getVal("tyreRRMake"), size:getVal("tyreRRSize"), no:getVal("tyreRRNo"), type:getVal("tyreRRType") },
      sp: { make:getVal("tyreSPMake"), size:getVal("tyreSPSize"), no:getVal("tyreSPNo"), type:getVal("tyreSPType") },
    },

    checklist: getChecklist(),

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
      surrender: { name: sigName1.value.trim(), image: canvasToDataUrl(sigCanvas1) },
      yard: { name: sigName2.value.trim(), image: canvasToDataUrl(sigCanvas2) },
      godown: { name: sigName3.value.trim(), image: canvasToDataUrl(sigCanvas3) },
    },

    status,
    updatedAt: new Date().toISOString()
  };
}

function fillForm(r){
  currentId = r.id || null;

  setVal("slNo", r.slNo);
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

  // Docs
  setChecked("docRC", r.documents?.rc?.received); setVal("docRCNote", r.documents?.rc?.note);
  setChecked("docTax", r.documents?.tax?.received); setVal("docTaxNote", r.documents?.tax?.note);
  setChecked("docPermit", r.documents?.permit?.received); setVal("docPermitNote", r.documents?.permit?.note);
  setChecked("docInsurance", r.documents?.insurance?.received); setVal("docInsuranceNote", r.documents?.insurance?.note);

  // Tyres
  setVal("tyreFLMake", r.tyres?.fl?.make); setVal("tyreFLSize", r.tyres?.fl?.size); setVal("tyreFLNo", r.tyres?.fl?.no); setVal("tyreFLType", r.tyres?.fl?.type || "Original");
  setVal("tyreFRMake", r.tyres?.fr?.make); setVal("tyreFRSize", r.tyres?.fr?.size); setVal("tyreFRNo", r.tyres?.fr?.no); setVal("tyreFRType", r.tyres?.fr?.type || "Original");
  setVal("tyreRLMake", r.tyres?.rl?.make); setVal("tyreRLSize", r.tyres?.rl?.size); setVal("tyreRLNo", r.tyres?.rl?.no); setVal("tyreRLType", r.tyres?.rl?.type || "Original");
  setVal("tyreRRMake", r.tyres?.rr?.make); setVal("tyreRRSize", r.tyres?.rr?.size); setVal("tyreRRNo", r.tyres?.rr?.no); setVal("tyreRRType", r.tyres?.rr?.type || "Original");
  setVal("tyreSPMake", r.tyres?.sp?.make); setVal("tyreSPSize", r.tyres?.sp?.size); setVal("tyreSPNo", r.tyres?.sp?.no); setVal("tyreSPType", r.tyres?.sp?.type || "Original");

  // Condition
  setVal("batteryMake", r.condition?.batteryMake);
  setVal("batteryNo", r.condition?.batteryNo);
  setVal("batteryCondition", r.condition?.batteryCondition);
  setVal("engineStatus", r.condition?.engineStatus);
  setVal("accidentFlag", r.condition?.accident || "No");
  setVal("towingFlag", r.condition?.towing || "No");

  setChecked("keyEngine", r.condition?.keys?.engineKey);
  setChecked("keyDoor", r.condition?.keys?.doorKey);
  setChecked("keyDslTank", r.condition?.keys?.dslTankKey);
  setChecked("keyOther", r.condition?.keys?.otherKey);
  setVal("keyOtherNote", r.condition?.keys?.otherNote);

  // Checklist
  setChecklist(r.checklist);

  // Photos
  currentPhotos = Array.isArray(r.photos) ? r.photos : [];
  renderPhotos();

  // Signatures
  sigName1.value = r.signatures?.surrender?.name || "";
  sigName2.value = r.signatures?.yard?.name || "";
  sigName3.value = r.signatures?.godown?.name || "";

  clearCanvas(sigCanvas1); clearCanvas(sigCanvas2); clearCanvas(sigCanvas3);
  dataUrlToCanvas(sigCanvas1, r.signatures?.surrender?.image);
  dataUrlToCanvas(sigCanvas2, r.signatures?.yard?.image);
  dataUrlToCanvas(sigCanvas3, r.signatures?.godown?.image);

  // Status & inv no
  const status = r.status || "Draft";
  setStatusUI(status);

  // keep inventoryNo stable
  setVal("inventoryNo", r.inventoryNo || newInventoryNo());

  // lock if submitted
  setFormLocked(status === "Submitted");
}

function validateForSubmit(){
  if(!getVal("vehicleNo")) return "Vehicle No is required.";
  if(!getVal("customerName")) return "Customer Name is required.";
  return null;
}

// Dashboard rendering
function renderList(){
  const q = (searchBox.value || "").trim().toLowerCase();
  const status = statusFilter.value;

  const all = loadRecords();
  const records = all.filter(r => {
    const okStatus = (status === "ALL") ? true : (r.status === status);
    if(!okStatus) return false;
    if(!q) return true;

    const hay = [
      r.inventoryNo, r.vehicleNo, r.customerName, r.financeName, r.agreementNo
    ].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  });

  updateStats(all, records.length);

  recordsList.innerHTML = "";
  if(!records.length){
    recordsList.innerHTML = `<div class="meta">No records found.</div>`;
    return;
  }

  records.forEach(r => {
    const div = document.createElement("div");
    div.className = "record-card";

    const meta = [
      r.vehicleNo || "(no vehicle)",
      r.vehicleType || "",
      r.customerName || "",
      r.updatedAt ? new Date(r.updatedAt).toLocaleString() : ""
    ].filter(Boolean).join(" • ");

    const isSubmitted = r.status === "Submitted";
    const statusChip = isSubmitted
      ? `<span class="chip submitted">Submitted</span>`
      : `<span class="chip draft">Draft</span>`;

    const editChip = isSubmitted
      ? `<span class="chip locked">Locked</span>`
      : `<span class="chip editable">Editable</span>`;

    const btnText = isSubmitted ? "View" : "Open";

    div.innerHTML = `
      <div class="card-top">
        <div>
          <div class="inv-no">${r.inventoryNo || "(no inv no)"}</div>
          <div class="card-meta">${meta}</div>
        </div>
        <div class="chips">
          ${statusChip}
          ${editChip}
        </div>
      </div>

      <div class="card-actions">
        <button data-id="${r.id}" class="primary">${btnText}</button>
      </div>
    `;

    div.querySelector("button").onclick = () => {
      fillForm(r);
      show("form");
    };

    recordsList.appendChild(div);
  });
}

// Events
btnNew.onclick = () => {
  // NEW: open a completely empty form for new entry
  currentId = null;
  clearFormToBlankNew();
  show("form");
};

btnDashboard.onclick = () => { renderList(); show("dash"); };
btnCancel.onclick = () => { renderList(); show("dash"); };

btnPrint.onclick = () => {
  if(!getVal("inventoryNo")) setVal("inventoryNo", newInventoryNo());
  window.print();
};

btnSaveDraft.onclick = () => {
  if(!getVal("inventoryNo")) setVal("inventoryNo", newInventoryNo());
  const rec = getRecordFromForm("Draft");
  upsertRecord(rec);
  alert("Saved as Draft");
  renderList();
  show("dash");
};

btnSubmit.onclick = () => {
  const err = validateForSubmit();
  if(err) return alert(err);

  if(!getVal("inventoryNo")) setVal("inventoryNo", newInventoryNo());
  const rec = getRecordFromForm("Submitted");
  upsertRecord(rec);
  alert("Submitted");
  renderList();
  show("dash");
};

btnDelete.onclick = () => {
  if(!currentId) return alert("Nothing to delete.");
  if(!confirm("Delete this record?")) return;
  deleteRecord(currentId);
  currentId = null;
  renderList();
  show("dash");
};

btnExport.onclick = () => {
  const data = JSON.stringify(loadRecords(), null, 2);
  const blob = new Blob([data], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "surya-parking-yard-inventory.json";
  a.click();
  URL.revokeObjectURL(url);
};

btnClearAll.onclick = () => {
  if(!confirm("Delete ALL local records?")) return;
  clearAllRecords();
  renderList();
};

searchBox.addEventListener("input", renderList);
statusFilter.addEventListener("change", renderList);

// Signature pads init
initSignaturePad(sigCanvas1);
initSignaturePad(sigCanvas2);
initSignaturePad(sigCanvas3);

btnClearSig1.onclick = () => clearCanvas(sigCanvas1);
btnClearSig2.onclick = () => clearCanvas(sigCanvas2);
btnClearSig3.onclick = () => clearCanvas(sigCanvas3);

// ---------- Sample Data (auto-seed when no records exist) ----------
function seedSampleDataIfEmpty(){
  const existing = loadRecords();
  if (Array.isArray(existing) && existing.length) return;

  const nowIso = new Date().toISOString();

  const sampleRecords = [
    {
      id: "SAMPLE-1",
      slNo: "138",
      inventoryNo: "INV-20250206-1001",
      inventoryDate: "2025-02-06",
      agreementNo: "AG-784512",
      financeName: "Tata Capital Finance Ltd",
      customerName: "Ravi Kumar",
      customerAddress: "Plot No 12, Hayathnagar, Hyderabad",
      repoAgencyName: "Sri Sai Recovery Services",
      seizedAt: "2025-02-05T14:30",
      yardInAt: "2025-02-05T18:15",
      vehicleType: "SUV",
      vehicleNo: "TS09AB1234",
      make: "Hyundai",
      model: "Creta",
      mfgYear: "2022",
      engineNo: "ENG9823471HY",
      chassisNo: "CHS98234HYD21",
      odometerKm: "45231",
      fuelPct: "35",
      notes: "Minor scratches on rear bumper.",
      documents: {
        rc: { received: true, note: "Original RC" },
        tax: { received: true, note: "Tax paid till 2025" },
        permit: { received: false, note: "" },
        insurance: { received: true, note: "Valid till 2025-12" }
      },
      tyres: {
        fl: { make: "MRF", size: "215/60R16", no: "MRF-88321", type: "Original" },
        fr: { make: "MRF", size: "215/60R16", no: "MRF-88322", type: "Original" },
        rl: { make: "MRF", size: "215/60R16", no: "MRF-88323", type: "Retread" },
        rr: { make: "MRF", size: "215/60R16", no: "MRF-88324", type: "Retread" },
        sp: { make: "MRF", size: "215/60R16", no: "MRF-88325", type: "Original" }
      },
      checklist: {
        chkFenders: true, chkHeadLights: true, chkParkLights: true, chkHorn: true, chkSideLights: true,
        chkFrontBumper: true, chkRadiatorCap: true, chkWindshield: true, chkWiper: true, chkTankCap: true,
        chkRearBumper: true, chkRearLights: true, chkTrapalin: false, chkDoorHandles: true, chkDoorGlass: true,
        chkInstrumentPanel: true, chkSpeedometer: true, chkRearViewMirror: true, chkCeilingLights: true,
        chkRubberMats: true, chkMudguard: false, chkMudLamp: false, chkSunVisor: true, chkStepneyWheel: true,
        chkTVLCD: false, chkCDDVD: false, chkAmplifier: false, chkSelfStarter: true, chkAlternator: true,
        chkWheelSpanner: true, chkAntenna: true, chkAC: true, chkCentralLock: true, chkBadges: true,
        chkLuggageCarrier: false
      },
      condition: {
        batteryMake: "Exide",
        batteryNo: "EX-778812",
        batteryCondition: "Good",
        engineStatus: "Running",
        accident: "No",
        towing: "No",
        keys: { engineKey: true, doorKey: true, dslTankKey: false, otherKey: false, otherNote: "" }
      },
      photos: [],
      signatures: {
        surrender: { name: "Ravi Kumar", image: "" },
        yard: { name: "M. Srinivas", image: "" },
        godown: { name: "K. Ramesh", image: "" }
      },
      status: "Submitted",
      updatedAt: nowIso
    },
    {
      id: "SAMPLE-2",
      slNo: "139",
      inventoryNo: "INV-20250206-1002",
      inventoryDate: "2025-02-06",
      agreementNo: "AG-998211",
      financeName: "Bajaj Finserv",
      customerName: "Mahesh Reddy",
      customerAddress: "Pedda Amberpet, RR District",
      repoAgencyName: "Om Recovery Agency",
      seizedAt: "2025-02-06T09:45",
      yardInAt: "2025-02-06T11:10",
      vehicleType: "2W",
      vehicleNo: "TS10XY5678",
      make: "Honda",
      model: "Activa 6G",
      mfgYear: "2023",
      engineNo: "ENGACT6789",
      chassisNo: "CHSACT6789HYD",
      odometerKm: "12000",
      fuelPct: "20",
      notes: "Front indicator broken. Vehicle starts OK.",
      documents: {
        rc: { received: true, note: "RC xerox" },
        tax: { received: true, note: "" },
        permit: { received: false, note: "" },
        insurance: { received: false, note: "" }
      },
      tyres: {
        fl: { make: "CEAT", size: "90/100-10", no: "CE-12091", type: "Original" },
        fr: { make: "CEAT", size: "90/100-10", no: "CE-12092", type: "Original" },
        rl: { make: "CEAT", size: "90/100-10", no: "CE-12093", type: "Original" },
        rr: { make: "CEAT", size: "90/100-10", no: "CE-12094", type: "Original" },
        sp: { make: "", size: "", no: "", type: "Original" }
      },
      checklist: {
        chkFenders: true, chkHeadLights: true, chkParkLights: true, chkHorn: false, chkSideLights: true,
        chkFrontBumper: true, chkRadiatorCap: false, chkWindshield: false, chkWiper: false, chkTankCap: true,
        chkRearBumper: false, chkRearLights: true, chkTrapalin: false, chkDoorHandles: false, chkDoorGlass: false,
        chkInstrumentPanel: true, chkSpeedometer: true, chkRearViewMirror: false, chkCeilingLights: false,
        chkRubberMats: false, chkMudguard: false, chkMudLamp: false, chkSunVisor: false, chkStepneyWheel: false,
        chkTVLCD: false, chkCDDVD: false, chkAmplifier: false, chkSelfStarter: true, chkAlternator: true,
        chkWheelSpanner: false, chkAntenna: false, chkAC: false, chkCentralLock: false, chkBadges: true,
        chkLuggageCarrier: false
      },
      condition: {
        batteryMake: "Amaron",
        batteryNo: "AM-553322",
        batteryCondition: "Good",
        engineStatus: "Running",
        accident: "No",
        towing: "No",
        keys: { engineKey: true, doorKey: false, dslTankKey: false, otherKey: true, otherNote: "Seat lock key" }
      },
      photos: [],
      signatures: {
        surrender: { name: "Mahesh Reddy", image: "" },
        yard: { name: "M. Srinivas", image: "" },
        godown: { name: "K. Ramesh", image: "" }
      },
      status: "Draft",
      updatedAt: nowIso
    },
    {
      id: "SAMPLE-3",
      slNo: "140",
      inventoryNo: "INV-20250206-1003",
      inventoryDate: "2025-02-06",
      agreementNo: "AG-441276",
      financeName: "HDFC Bank Auto Loans",
      customerName: "Shiva Prasad",
      customerAddress: "LB Nagar, Hyderabad",
      repoAgencyName: "Sai Vinayaka Repo",
      seizedAt: "2025-02-04T16:20",
      yardInAt: "2025-02-04T20:00",
      vehicleType: "LCV",
      vehicleNo: "AP28CD9090",
      make: "Mahindra",
      model: "Bolero Pickup",
      mfgYear: "2021",
      engineNo: "ENGMHB9090",
      chassisNo: "CHSMHB9090LCV",
      odometerKm: "98210",
      fuelPct: "60",
      notes: "Rear tail light damaged. Cargo area intact.",
      documents: {
        rc: { received: true, note: "Original" },
        tax: { received: true, note: "Up to date" },
        permit: { received: true, note: "National permit" },
        insurance: { received: true, note: "Valid till 2025-08" }
      },
      tyres: {
        fl: { make: "Apollo", size: "195R15", no: "AP-77801", type: "Retread" },
        fr: { make: "Apollo", size: "195R15", no: "AP-77802", type: "Retread" },
        rl: { make: "Apollo", size: "195R15", no: "AP-77803", type: "Original" },
        rr: { make: "Apollo", size: "195R15", no: "AP-77804", type: "Original" },
        sp: { make: "Apollo", size: "195R15", no: "AP-77805", type: "Original" }
      },
      checklist: {
        chkFenders: true, chkHeadLights: true, chkParkLights: true, chkHorn: true, chkSideLights: true,
        chkFrontBumper: true, chkRadiatorCap: true, chkWindshield: true, chkWiper: true, chkTankCap: true,
        chkRearBumper: true, chkRearLights: false, chkTrapalin: true, chkDoorHandles: true, chkDoorGlass: true,
        chkInstrumentPanel: true, chkSpeedometer: true, chkRearViewMirror: true, chkCeilingLights: false,
        chkRubberMats: false, chkMudguard: true, chkMudLamp: true, chkSunVisor: true, chkStepneyWheel: true,
        chkTVLCD: false, chkCDDVD: false, chkAmplifier: false, chkSelfStarter: true, chkAlternator: true,
        chkWheelSpanner: true, chkAntenna: true, chkAC: false, chkCentralLock: false, chkBadges: true,
        chkLuggageCarrier: true
      },
      condition: {
        batteryMake: "Exide",
        batteryNo: "EX-901122",
        batteryCondition: "Weak",
        engineStatus: "Running",
        accident: "No",
        towing: "Yes",
        keys: { engineKey: true, doorKey: true, dslTankKey: true, otherKey: false, otherNote: "" }
      },
      photos: [],
      signatures: {
        surrender: { name: "Shiva Prasad", image: "" },
        yard: { name: "M. Srinivas", image: "" },
        godown: { name: "K. Ramesh", image: "" }
      },
      status: "Submitted",
      updatedAt: nowIso
    }
  ];

  sampleRecords.forEach(r => upsertRecord(r));
}

// init
seedSampleDataIfEmpty();
renderList();
show("dash");
setFormLocked(false);
