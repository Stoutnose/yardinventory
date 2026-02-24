// Branch-aware localStorage for 3 branches.
// Each branch has its own data bucket.

const KEY_PREFIX = "sp_inventory_records_pdf_v2";
const BRANCH_KEY = "sp_current_branch";

// current dashboard branch
function getBranchId(){
  return localStorage.getItem(BRANCH_KEY) || "HN";
}
function setBranchId(id){
  localStorage.setItem(BRANCH_KEY, id);
}

// key for a branch
function getStorageKey(branchId){
  const b = branchId || getBranchId();
  return `${KEY_PREFIX}__${b}`;
}

// Load records for a given branch (or current)
function loadRecords(branchId) {
  try { return JSON.parse(localStorage.getItem(getStorageKey(branchId)) || "[]"); }
  catch { return []; }
}

// Save records for a given branch (or current)
function saveRecords(records, branchId) {
  localStorage.setItem(getStorageKey(branchId), JSON.stringify(records));
}

// Upsert into a specific branch
function upsertRecord(record, branchId) {
  const b = branchId || record.branchId || getBranchId();
  const records = loadRecords(b);

  const i = records.findIndex(r => r.id === record.id);
  if (i >= 0) records[i] = record;
  else records.unshift(record);

  saveRecords(records, b);
  return record;
}

// Delete from a specific branch
function deleteRecord(id, branchId) {
  const b = branchId || getBranchId();
  saveRecords(loadRecords(b).filter(r => r.id !== id), b);
}

// Clear a specific branch
function clearAllRecords(branchId){
  const b = branchId || getBranchId();
  localStorage.removeItem(getStorageKey(b));
}
