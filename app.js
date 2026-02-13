// =====================================================
// Surya Parking Yard - Complete Dashboard + Form Logic
// =====================================================

// ---------------------
// View References
// ---------------------
const dashboardView = document.getElementById("dashboardView");
const formView = document.getElementById("formView");

// Header Buttons
const btnDashboard = document.getElementById("btnDashboard");
const btnNew = document.getElementById("btnNew");
const btnPrintTop = document.getElementById("btnPrint");

const btnNavSearch = document.getElementById("btnNavSearch");
const btnNavFilter = document.getElementById("btnNavFilter");
const btnNavViewAll = document.getElementById("btnNavViewAll");
const btnNavReports = document.getElementById("btnNavReports");

// Dashboard Cards
const dashBtnAdd = document.getElementById("dashBtnAdd");
const dashBtnSearch = document.getElementById("dashBtnSearch");
const dashBtnFilter = document.getElementById("dashBtnFilter");
const dashBtnViewAll = document.getElementById("dashBtnViewAll");
const dashBtnReports = document.getElementById("dashBtnReports");
const dashBtnPrint = document.getElementById("dashBtnPrint");

// Dashboard Panels
const dashHomePanel = document.getElementById("dashHomePanel");
const dashSearchPanel = document.getElementById("dashSearchPanel");
const dashFilterPanel = document.getElementById("dashFilterPanel");
const dashViewAllPanel = document.getElementById("dashViewAllPanel");
const dashReportsPanel = document.getElementById("dashReportsPanel");
const dashPrintPanel = document.getElementById("dashPrintPanel");
const dashPanelTitle = document.getElementById("dashPanelTitle");

// Dashboard Elements
const kpiRow = document.getElementById("kpiRow");
const recentList = document.getElementById("recentList");

const searchInput = document.getElementById("searchInput");
const btnDoSearch = document.getElementById("btnDoSearch");
const btnClearSearch = document.getElementById("btnClearSearch");
const searchTable = document.getElementById("searchTable");

const filterType = document.getElementById("filterType");
const filterKey = document.getElementById("filterKey");
const filterAccident = document.getElementById("filterAccident");
const filterFrom = document.getElementById("filterFrom");
const filterTo = document.getElementById("filterTo");
const btnApplyFilter = document.getElementById("btnApplyFilter");
const btnResetFilter = document.getElementById("btnResetFilter");
const filterTable = document.getElementById("filterTable");

const viewAllMeta = document.getElementById("viewAllMeta");
const viewAllTable = document.getElementById("viewAllTable");

const reportKpis = document.getElementById("reportKpis");
const btnDownloadExcel = document.getElementById("btnDownloadExcel");

const printSelect = document.getElementById("printSelect");
const btnPrintSingle = document.getElementById("btnPrintSingle");
const btnPrintList = document.getElementById("btnPrintList");

const btnExport = document.getElementById("btnExport");
const btnClearAll = document.getElementById("btnClearAll");

// Form Buttons
const btnSaveDraft = document.getElementById("btnSaveDraft");
const btnSubmit = document.getElementById("btnSubmit");
const btnCancel = document.getElementById("btnCancel");
const btnDelete = document.getElementById("btnDelete");

const statusBadge = document.getElementById("statusBadge");
const inventoryNo = document.getElementById("inventoryNo");

// ---------------------
// Helpers
// ---------------------
function byId(id){ return document.getElementById(id); }
function getVal(id){ return byId(id)?.value || ""; }
function setVal(id,v){ if(byId(id)) byId(id).value = v || ""; }

let currentId = null;

// ---------------------
// View Switch
// ---------------------
function show(view){
  dashboardView.classList.toggle("hidden", view !== "dash");
  formView.classList.toggle("hidden", view !== "form");
  window.scrollTo(0,0);
}

function showDashPanel(name){
  const panels = {
    home: dashHomePanel,
    search: dashSearchPanel,
    filter: dashFilterPanel,
    viewall: dashViewAllPanel,
    reports: dashReportsPanel,
    print: dashPrintPanel
  };
  Object.values(panels).forEach(p => p.classList.add("hidden"));
  panels[name].classList.remove("hidden");

  dashPanelTitle.textContent = name.charAt(0).toUpperCase()+name.slice(1);
}

// ---------------------
// Inventory Number
// ---------------------
function newInventoryNo(){
  const d = new Date();
  return "INV-" + d.getFullYear() + (d.getMonth()+1) + d.getDate() + "-" + Math.floor(Math.random()*1000);
}

// ---------------------
// Dashboard Rendering
// ---------------------
function computeStats(records){
  return {
    total: records.length,
    twoW: records.filter(r=>r.vehicleType==="2W").length,
    fourW: records.filter(r=>r.vehicleType==="4W").length,
    noKey: records.filter(r=>!r.keyAvailable).length,
    accident: records.filter(r=>r.accident==="Yes").length
  };
}

function renderDashboard(){
  const records = loadRecords();
  const stats = computeStats(records);

  kpiRow.innerHTML = `
    <div class="kpi"><div>Total Vehicles</div><div>${stats.total}</div></div>
    <div class="kpi"><div>Two Wheelers</div><div>${stats.twoW}</div></div>
    <div class="kpi"><div>Four Wheelers</div><div>${stats.fourW}</div></div>
    <div class="kpi"><div>No Key</div><div>${stats.noKey}</div></div>
    <div class="kpi"><div>Accident</div><div>${stats.accident}</div></div>
  `;

  recentList.innerHTML="";
  records.slice(0,5).forEach(r=>{
    const div=document.createElement("div");
    div.className="record";
    div.innerHTML=`
      <div><strong>${r.vehicleNo}</strong><div>${r.customerName}</div></div>
      <button data-id="${r.id}">Open</button>
    `;
    div.querySelector("button").onclick=()=>{
      fillForm(r);
      show("form");
    };
    recentList.appendChild(div);
  });

  printSelect.innerHTML="<option value=''>Select Vehicle</option>";
  records.forEach(r=>{
    const opt=document.createElement("option");
    opt.value=r.id;
    opt.textContent=r.vehicleNo;
    printSelect.appendChild(opt);
  });
}

// ---------------------
// Save / Load
// ---------------------
function getFormData(status){
  return {
    id: currentId || crypto.randomUUID(),
    inventoryNo: inventoryNo.value || newInventoryNo(),
    vehicleNo: getVal("vehicleNo"),
    customerName: getVal("customerName"),
    vehicleType: getVal("vehicleType"),
    financeName: getVal("financeName"),
    yardInAt: getVal("yardInAt"),
    accident: getVal("accidentFlag"),
    keyAvailable: byId("keyEngine")?.checked,
    status
  };
}

function fillForm(r){
  currentId=r.id;
  inventoryNo.value=r.inventoryNo;
  setVal("vehicleNo",r.vehicleNo);
  setVal("customerName",r.customerName);
  setVal("vehicleType",r.vehicleType);
  setVal("financeName",r.financeName);
  setVal("yardInAt",r.yardInAt);
  setVal("accidentFlag",r.accident);
  if(byId("keyEngine")) byId("keyEngine").checked=r.keyAvailable;
  statusBadge.textContent=r.status;
}

function clearForm(){
  currentId=null;
  inventoryNo.value=newInventoryNo();
  ["vehicleNo","customerName","financeName","yardInAt"].forEach(id=>setVal(id,""));
}

// ---------------------
// Search
// ---------------------
function runSearch(){
  const q=searchInput.value.toLowerCase();
  const records=loadRecords().filter(r=>
    r.vehicleNo.toLowerCase().includes(q) ||
    r.customerName.toLowerCase().includes(q)
  );
  searchTable.innerHTML=buildTable(records);
}

// ---------------------
// Table Builder
// ---------------------
function buildTable(records){
  return `
    <tr>
      <th>Vehicle</th><th>Type</th><th>Finance</th><th>Status</th>
    </tr>
    ${records.map(r=>`
      <tr>
        <td>${r.vehicleNo}</td>
        <td>${r.vehicleType}</td>
        <td>${r.financeName}</td>
        <td>${r.status}</td>
      </tr>
    `).join("")}
  `;
}

// ---------------------
// Events
// ---------------------
btnNew.onclick=()=>{
  clearForm();
  show("form");
};

btnDashboard.onclick=()=>show("dash");
btnCancel.onclick=()=>show("dash");

btnSaveDraft.onclick=()=>{
  const rec=getFormData("Draft");
  upsertRecord(rec);
  show("dash");
  renderDashboard();
};

btnSubmit.onclick=()=>{
  const rec=getFormData("Submitted");
  upsertRecord(rec);
  show("dash");
  renderDashboard();
};

btnDelete.onclick=()=>{
  if(!currentId) return;
  deleteRecord(currentId);
  show("dash");
  renderDashboard();
};

btnDoSearch.onclick=runSearch;
btnClearSearch.onclick=()=>searchInput.value="";

dashBtnAdd.onclick=()=>btnNew.click();
dashBtnSearch.onclick=()=>showDashPanel("search");
dashBtnFilter.onclick=()=>showDashPanel("filter");
dashBtnViewAll.onclick=()=>{
  showDashPanel("viewall");
  viewAllTable.innerHTML=buildTable(loadRecords());
};
dashBtnReports.onclick=()=>{
  showDashPanel("reports");
  renderDashboard();
};
dashBtnPrint.onclick=()=>showDashPanel("print");

btnPrintSingle.onclick=()=>{
  const id=printSelect.value;
  if(!id) return alert("Select vehicle");
  const rec=loadRecords().find(r=>r.id===id);
  fillForm(rec);
  show("form");
  window.print();
};

btnPrintList.onclick=()=>window.print();

btnDownloadExcel.onclick=()=>{
  const records=loadRecords();
  const csv=["Vehicle,Type,Finance,Status",
    ...records.map(r=>`${r.vehicleNo},${r.vehicleType},${r.financeName},${r.status}`)
  ].join("\n");
  const blob=new Blob([csv],{type:"text/csv"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="vehicles.csv";
  a.click();
};

// ---------------------
// Initial Load
// ---------------------
show("dash");
renderDashboard();
