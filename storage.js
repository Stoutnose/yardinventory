const KEY = "sp_inventory_records_pdf_v1";

function loadRecords() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

function saveRecords(records) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

function upsertRecord(record) {
  const records = loadRecords();
  const i = records.findIndex(r => r.id === record.id);
  if (i >= 0) records[i] = record;
  else records.unshift(record);
  saveRecords(records);
  return record;
}

function deleteRecord(id) {
  saveRecords(loadRecords().filter(r => r.id !== id));
}

function clearAllRecords(){
  localStorage.removeItem(KEY);
}
