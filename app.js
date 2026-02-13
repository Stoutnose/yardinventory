// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);
const dashboardView = $("dashboardView");
const formView = $("formView");
const recordsList = $("recordsList");

const btnDashboard = $("btnDashboard");
const btnNew = $("btnNew");
const btnPrint = $("btnPrint");

const btnSaveDraft = $("btnSaveDraft");
const btnSubmit = $("btnSubmit");
const btnCancel = $("btnCancel");
const btnDelete = $("btnDelete");

const btnExport = $("btnExport");
const btnClearAll = $("btnClearAll");

const searchBox = $("searchBox");
const statusFilter = $("statusFilter");

const statusBadge = $("statusBadge");

const sigCanvas1 = $("sigCanvas1");
const sigCanvas2 = $("sigCanvas2");
const sigCanvas3 = $("sigCanvas3");

const sigName1 = $("sigName1");
const sigName2 = $("sigName2");
const sigName3 = $("sigName3");

const btnClearSig1 = $("btnClearSig1");
const btnClearSig2 = $("btnClearSig2");
const btnClearSig3 = $("btnClearSig3");

const photoType = $("photoType");
const photoFile = $("photoFile");
const btnAddPhoto = $("btnAddPhoto");
const photoGrid = $("photoGrid");

let currentId = null;
let currentPhotos = [];

// ---------- View routing ----------
function show(view){
  dashboardView.classList.toggle("hidden", view !== "dash");
  formView.classList.toggle("hidden", view !== "form");
  window.scrollTo(0,0);
}

function newInventoryNo(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  const rnd = Math.floor(Math.random()*9000+1000);
  return `INV-${yyyy}${mm}${dd}-${rnd}`;
}

function setVal(id, v){ $(id).value = v ?? ""; }
function getVal(id){ return ($(id).value || "").trim(); }
function setChecked(id, v){ $(id).checked = !!v; }
function getChecked(id){ return $(id).checked; }

// ---------- Signature pad (FIXED for mobile) ----------
function initSignaturePad(canvas){
  const ctx = canvas.getContext("2d");

  function fitCanvas(){
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h){
      // NOTE: resizing clears the drawing (acceptable for demo)
      canvas.width = w;
      canvas.height = h;
    }
    ctx.lineWidth = 2.2 * dpr;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0a53a8";
  }

  fitCanvas();
  window.addEventListener("resize", fitCanvas);

  let drawing = false;
  let last = null;

  function posFromEvent(e){
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  // Prevent page scroll ONLY while signing on the canvas
  canvas.style.touchAction = "none";

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    drawing = true;
    last = posFromEvent(e);
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if(!drawing) return;
    e.preventDefault();
    const p = posFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  });

  function stop(e){
    if(!drawing) return;
    e.preventDefault();
    drawing = false;
    last = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  }

  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
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
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = dataUrl;
}

// ---------- Checklist mapping ----------
const checklistIds = [
  "chkFenders","chkHeadLights","chkParkLights","chkHorn","chkSideLights","chkFrontBumper",
  "chkRadiatorCap","chkWindshield","chkWiper","chkTankCap","chkRearBumper","chkRearLights",
  "chkTrapalin","chkDoorHandles","chkDoorGlass","chkInstrumentPanel","chkSpeedometer",
  "chkRearViewMirror","chkCeilingLights","chkRubberMats","chkMudguard","chkMudLamp","chkSunVisor",
  "chkStepneyWheel","chkTVLCD","chkCDDVD","chkAmplifier","chkSelfStarter","chkAlternator",
  "chkWheelSpanner","chkAntenna","chkAC","chkCentralLock","chkBadges","chkLuggageCarrier"
];

function getChecklist(){
  const o = {};
  checklistIds.forEach(id => o[id] = getChecked(id));
  return o;
}
function setChecklist(o){
  checklistIds.forEach(id => setChecked(id, o?.[id]));
}

// ---------- Photos ----------
function renderPhotos(){
  photoGrid.innerHTML = "";
  if(!currentPhotos.length){
    photoGrid.innerHTML = `<div class="meta">No photos added.</div>`;
    return;
  }
  currentPhotos.forEach((p, idx) => {
    const card = document.createElement("div");
    card.className = "photo-card";
    card.innerHTML = `
      <img src="${p.dataUrl}" alt="${p.type}">
      <div class="photo-meta">
        <span class="type">${p.type}</span>
        <button class="danger" data-idx="${idx}">Remove</button>
      </div>
    `;
    card.querySelector("button").onclick = () => {
      currentPhotos.splice(idx,1);
      renderPhotos();
    };
    photoGrid.appendChild(card);
  });
}

btnAddPhoto.onclick = () => {
  const file = photoFile.files?.[0];
  if(!file) return alert("Choose a photo first.");
  const reader = new FileReader();
  reader.onload = () => {
    currentPhotos.push({ type: photoType.value, dataUrl: reader.result });
    photoFile.value = "";
    renderPhotos();
  };
  reader.readAsDataURL(file);
};

// ---------- Status UI ----------
function setStatusUI(status){
  statusBadge.textContent = status;
  statusBadge.style.background = status === "Submitted" ? "rgba(16,185,129,.12)" : "rgba(10,83,168,.08)";
  statusBadge.style.borderColor = status === "Submitted" ? "rgba(16,185,129,.35)" : "rgba(10,83,168,.35)";
  statusBadge.style.color = status === "Submitted" ? "#0f7a58" : "var(--blue)";
}

// ---------- Form serialization ----------
function getRecordFromForm(status){
  const id = currentId || crypto.randomUUID();

  return {
    id,
    slNo: getVal("slNo"),
    inventoryNo: getVal("inventoryNo") || newInventoryNo(),
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
    tyres: {
      fl: { make:getVal("tyreFLMake"), size:getVal("tyreFLSize"), no:getVal("tyreFLNo"), type:getVal("tyreFLType") },
      fr: { make:getVal("tyreFRMake"), size:getVal("tyreFRSize"), no:getVal("tyreFRNo"), type:getVal("tyreFRType") },
      rl: { make:getVal("tyreRLMake"), size:getVal("tyreRLSize"), no:getVal("tyreRLNo"), type:getVal("tyreRLType") },
      rr: { make:getVal("tyreRRMake"), size:getVal("tyreRRSize"), no:getVal("tyreRRNo"), type:getVal("tyreRRType") },
      sp: { make:getVal("tyreSPMake"), size:getVal("tyreSPSize"), no:getVal("tyreSPNo"), type:getVal("tyreSPType") }
    },
    checklist: getChecklist(),
    condition: {
      batteryMake: getVal("batteryMake"),
      batteryNo: getVal("batteryNo"),
      batteryCondition: getVal("batteryCondition"),
      engineStatus: getVal("engineStatus"),
      accident: getVal("accidentFlag") || "No",
      towing: getVal("towingFlag") || "No",
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
      godown: { name: sigName3.value.trim(), image: canvasToDataUrl(sigCanvas3) }
    },
    status,
    updatedAt: new Date().toISOString()
  };
}

function clearFormToBlankNew(){
  currentId = null;
  currentPhotos = [];
  renderPhotos();

  const inputs = document.querySelectorAll("input, select, textarea");
  inputs.forEach(el => {
    if(el.type === "checkbox") el.checked = false;
    else if(el.id === "inventoryNo") el.value = newInventoryNo();
    else el.value = "";
  });

  clearCanvas(sigCanvas1); clearCanvas(sigCanvas2); clearCanvas(sigCanvas3);
  setStatusUI("Draft");
}

function fillForm(r){
  currentId = r.id;

  setVal("slNo", r.slNo);
  setVal("inventoryNo", r.inventoryNo || newInventoryNo());
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
  setVal("odometerKm", r.odometerKm);
  setVal("fuelPct", r.fuelPct);

  setVal("tyreFLMake", r.tyres?.fl?.make); setVal("tyreFLSize", r.tyres?.fl?.size); setVal("tyreFLNo", r.tyres?.fl?.no); setVal("tyreFLType", r.tyres?.fl?.type || "Original");
  setVal("tyreFRMake", r.tyres?.fr?.make); setVal("tyreFRSize", r.tyres?.fr?.size); setVal("tyreFRNo", r.tyres?.fr?.no); setVal("tyreFRType", r.tyres?.fr?.type || "Original");
  setVal("tyreRLMake", r.tyres?.rl?.make); setVal("tyreRLSize", r.tyres?.rl?.size); setVal("tyreRLNo", r.tyres?.rl?.no); setVal("tyreRLType", r.tyres?.rl?.type || "Original");
  setVal("tyreRRMake", r.tyres?.rr?.make); setVal("tyreRRSize", r.tyres?.rr?.size); setVal("tyreRRNo", r.tyres?.rr?.no); setVal("tyreRRType", r.tyres?.rr?.type || "Original");
  setVal("tyreSPMake", r.tyres?.sp?.make); setVal("tyreSPSize", r.tyres?.sp?.size); setVal("tyreSPNo", r.tyres?.sp?.no); setVal("tyreSPType", r.tyres?.sp?.type || "Original");

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

  setChecklist(r.checklist);

  currentPhotos = Array.isArray(r.photos) ? r.photos : [];
  renderPhotos();

  sigName1.value = r.signatures?.surrender?.name || "";
  sigName2.value = r.signatures?.yard?.name || "";
  sigName3.value = r.signatures?.godown?.name || "";

  clearCanvas(sigCanvas1); clearCanvas(sigCanvas2); clearCanvas(sigCanvas3);
  dataUrlToCanvas(sigCanvas1, r.signatures?.surrender?.image);
  dataUrlToCanvas(sigCanvas2, r.signatures?.yard?.image);
  dataUrlToCanvas(sigCanvas3, r.signatures?.godown?.image);

  setStatusUI(r.status || "Draft");
  setVal("inventoryNo", r.inventoryNo || newInventoryNo());
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

  const records = loadRecords().filter(r => {
    const okStatus = (status === "ALL") ? true : (r.status === status);
    if(!okStatus) return false;
    if(!q) return true;

    const hay = [r.inventoryNo, r.vehicleNo, r.customerName, r.financeName, r.agreementNo]
      .filter(Boolean).join(" ").toLowerCase();
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

    const meta = [
      r.vehicleNo || "(no vehicle)",
      r.vehicleType || "",
      r.customerName || "",
      r.updatedAt ? new Date(r.updatedAt).toLocaleString() : ""
    ].filter(Boolean).join(" • ");

    const pillClass = r.status === "Submitted" ? "sub" : "draft";

    div.innerHTML = `
      <div class="left">
        <strong>${r.inventoryNo || "(no inv no)"}</strong>
        <div class="meta">${meta}</div>
      </div>
      <div class="right">
        <span class="pill ${pillClass}">${r.status}</span>
        <button data-id="${r.id}" class="primary">Open</button>
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
btnNew.onclick = () => { currentId = null; clearFormToBlankNew(); show("form"); };
btnDashboard.onclick = () => { renderList(); show("dash"); };
btnCancel.onclick = () => { renderList(); show("dash"); };

btnPrint.onclick = () => { if(!getVal("inventoryNo")) setVal("inventoryNo", newInventoryNo()); window.print(); };

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
      tyres: {
        fl: { make: "Apollo", size: "195R15", no: "AP-77801", type: "Original" },
        fr: { make: "Apollo", size: "195R15", no: "AP-77802", type: "Original" },
        rl: { make: "Apollo", size: "195R15", no: "AP-77803", type: "Original" },
        rr: { make: "Apollo", size: "195R15", no: "AP-77804", type: "Original" },
        sp: { make: "Apollo", size: "195R15", no: "AP-77805", type: "Original" }
      },
      checklist: {},
      condition: {
        batteryMake: "Exide",
        batteryNo: "EX-660012",
        batteryCondition: "Weak",
        engineStatus: "Starting Weak",
        accident: "No",
        towing: "Yes",
        keys: { engineKey: true, doorKey: true, dslTankKey: true, otherKey: false, otherNote: "" }
      },
      photos: [],
      signatures: { surrender: { name: "", image: "" }, yard: { name: "", image: "" }, godown: { name: "", image: "" } },
      status: "Submitted",
      updatedAt: nowIso
    }
  ];

  saveRecords(sampleRecords);
}

// Boot
seedSampleDataIfEmpty();
renderList();
show("dash");
