// ================================================================
//   家計簿アプリ - Google Apps Script バックエンド
//   スプレッドシートのスクリプトエディタに貼り付けて使用
// ================================================================

const SHEET_RECORDS  = "records";
const SHEET_SETTINGS = "settings";

// ── シートを初期化（なければ作成） ────────────────────────────
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // records シート
  let recSheet = ss.getSheetByName(SHEET_RECORDS);
  if (!recSheet) {
    recSheet = ss.insertSheet(SHEET_RECORDS);
    recSheet.appendRow([
      "id","date","amount","category",
      "payee","memo","isFixed","isBiz",
      "bizCategory","createdAt","updatedBy","isSpecial"
    ]);
    recSheet.setFrozenRows(1);
    // ヘッダー書式
    recSheet.getRange(1,1,1,12).setBackground("#1a1a1a").setFontColor("#ffffff").setFontWeight("bold");
  }

  // settings シート
  let setSheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!setSheet) {
    setSheet = ss.insertSheet(SHEET_SETTINGS);
    setSheet.appendRow(["key","value"]);
    setSheet.setFrozenRows(1);
    setSheet.getRange(1,1,1,2).setBackground("#1a1a1a").setFontColor("#ffffff").setFontWeight("bold");
  }

  return { recSheet, setSheet };
}

// ── 既存シートに isSpecial 列を追加（一度だけ実行する移行処理） ──
function migrateAddIsSpecialColumn() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const recSheet = ss.getSheetByName(SHEET_RECORDS);
  const headers = recSheet.getRange(1,1,1,recSheet.getLastColumn()).getValues()[0];
  if (headers.indexOf("isSpecial") !== -1) return; // 既に追加済み

  const updatedByIdx = headers.indexOf("updatedBy"); // 0-based
  const insertAfterCol = updatedByIdx >= 0 ? updatedByIdx + 1 : recSheet.getLastColumn();
  recSheet.insertColumnAfter(insertAfterCol);

  const newCol = insertAfterCol + 1;
  recSheet.getRange(1, newCol).setValue("isSpecial");

  const lastRow = recSheet.getLastRow();
  if (lastRow > 1) {
    const values = [];
    for (let i = 0; i < lastRow - 1; i++) values.push([false]);
    recSheet.getRange(2, newCol, lastRow - 1, 1).setValues(values);
  }
}

// ── CORS対応レスポンス ─────────────────────────────────────────
function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── OPTIONSリクエスト対応（プリフライト） ──────────────────────
function doOptions(e) {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

// ── GET: データ取得 ───────────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action || "getAll";
    const { recSheet, setSheet } = initSheets();

    if (action === "getAll") {
      // records
      const recData = recSheet.getDataRange().getValues();
      const headers = recData[0];
      const records = recData.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i]; });
        obj.amount = Number(obj.amount) || 0;
        obj.isFixed = obj.isFixed === true || obj.isFixed === "TRUE";
        obj.isBiz = obj.isBiz === true || obj.isBiz === "TRUE";
        obj.isSpecial = obj.isSpecial === true || obj.isSpecial === "TRUE";
        obj.bizCategory = obj.bizCategory || "";
        return obj;
      }).filter(r => r.id); // 空行除外

      // settings
      const setData = setSheet.getDataRange().getValues();
      const settings = {};
      setData.slice(1).forEach(row => {
        if (row[0]) {
          try { settings[row[0]] = JSON.parse(row[1]); }
          catch { settings[row[0]] = row[1]; }
        }
      });

      return respond({ ok: true, records, settings });
    }

  } catch(err) {
    return respond({ ok: false, error: err.message });
  }
}

// ── POST: データ保存 ───────────────────────────────────────────
function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;
    const { recSheet, setSheet } = initSheets();

    // ── レコード追加 ──
    if (action === "addRecord") {
      const r = body.record;
      recSheet.appendRow([
        r.id, r.date, r.amount, r.category||"",
        r.payee||"", r.memo||"",
        r.isFixed||false, r.isBiz||false,
        r.bizCategory||"",
        new Date().toISOString(),
        r.updatedBy||"unknown",
        r.isSpecial||false
      ]);
      return respond({ ok: true });
    }

    // ── レコード削除 ──
    if (action === "deleteRecord") {
      const id = String(body.id);
      const data = recSheet.getDataRange().getValues();
      for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][0]) === id) {
          recSheet.deleteRow(i + 1);
          break;
        }
      }
      return respond({ ok: true });
    }

    // ── 複数レコード追加（固定費一括） ──
    if (action === "addRecords") {
      const rows = body.records.map(r => [
        r.id, r.date, r.amount, r.category||"",
        r.payee||"", r.memo||"",
        r.isFixed||false, r.isBiz||false,
        r.bizCategory||"",
        new Date().toISOString(),
        r.updatedBy||"unknown",
        r.isSpecial||false
      ]);
      if (rows.length > 0) {
        recSheet.getRange(
          recSheet.getLastRow() + 1, 1, rows.length, rows[0].length
        ).setValues(rows);
      }
      return respond({ ok: true });
    }

    // ── 設定保存 ──
    if (action === "saveSetting") {
      const key = body.key;
      const value = JSON.stringify(body.value);
      const data = setSheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          setSheet.getRange(i + 1, 2).setValue(value);
          found = true;
          break;
        }
      }
      if (!found) {
        setSheet.appendRow([key, value]);
      }
      return respond({ ok: true });
    }

    // ── 全設定保存 ──
    if (action === "saveAllSettings") {
      const settings = body.settings; // { key: value, ... }
      Object.entries(settings).forEach(([key, value]) => {
        const strVal = JSON.stringify(value);
        const data = setSheet.getDataRange().getValues();
        let found = false;
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] === key) {
            setSheet.getRange(i + 1, 2).setValue(strVal);
            found = true;
            break;
          }
        }
        if (!found) setSheet.appendRow([key, strVal]);
      });
      return respond({ ok: true });
    }

    return respond({ ok: false, error: "unknown action: " + action });

  } catch(err) {
    return respond({ ok: false, error: err.message });
  }
}
