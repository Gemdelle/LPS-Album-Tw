/**
 * LPS Twitch — adopción + cola de entrega a Stream Avatars
 *
 * Pegá este archivo en un PROYECTO NUEVO de Apps Script atado a la misma
 * Spreadsheet del album (NO edites el script viejo del album).
 *
 * Extensiones > Apps Script (desde la hoja) > proyecto nuevo, o
 * script.google.com > New project > pegar > Deploy > Web app.
 *
 * Propiedades (Project Settings > Script properties):
 *   SHARED_SECRET          secreto entre este script y el Lua local
 *   AUTOMATION_ENABLED     true | false  (false = la web sigue canjeando, Lua no entrega)
 *
 * Hoja usada: TWITCH
 * Columnas A–E: id, code, adopter, price, (lo que quieras).
 * Desde F: saId, adoptionId, twitchName, deliveryStatus, …
 * Hoja de colección: la primera pestaña (gid 0) para chequear OWNED + nombre.
 */

var TWITCH_SHEET_NAME = "TWITCH";
var EXTRA_START_COL = 6; // F
var STALE_PROCESSING_MS = 2 * 60 * 1000;
var MAX_DELIVERY_ATTEMPTS = 5;

var EXTRA_HEADERS = [
  "saId",
  "adoptionId",
  "twitchName",
  "deliveryStatus",
  "adoptedAt",
  "deliveredAt",
  "deliveryAttempts",
  "lastError",
  "processingAt"
];

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = String(p.action || "").trim();
    if (!action) {
      return json_({ ok: true, service: "lps-twitch-adopt" });
    }
    if (action === "redeem") {
      return json_(redeem_(p));
    }
    if (!checkSecret_(p.secret)) {
      return json_({ ok: false, error: "unauthorized" });
    }
    if (action === "claimNext") {
      return json_(claimNext_());
    }
    if (action === "confirm") {
      return json_(confirm_(p.adoptionId));
    }
    if (action === "error") {
      return json_(reportError_(p.adoptionId, p.message));
    }
    return json_({ ok: false, error: "unknown_action" });
  } catch (err) {
    return json_({ ok: false, error: "script_error", detail: String(err) });
  }
}

function spreadsheet_() {
  return SpreadsheetApp.openById("1wo8iJYUg_1tjJbJ_RnFbSk-cHmMgV2s3MlmYcRvMACg");
}

function doPost(e) {
  try {
    var body = readBody_(e);
    var action = String(body.action || "").trim();

    if (action === "redeem") {
      return json_(redeem_(body));
    }

    if (!checkSecret_(body.secret)) {
      return json_({ ok: false, error: "unauthorized" });
    }

    if (action === "claimNext") {
      return json_(claimNext_());
    }
    if (action === "confirm") {
      return json_(confirm_(body.adoptionId));
    }
    if (action === "error") {
      return json_(reportError_(body.adoptionId, body.message));
    }

    return json_({ ok: false, error: "unknown_action" });
  } catch (err) {
    return json_({ ok: false, error: "script_error", detail: String(err) });
  }
}

function redeem_(body) {
  var code = normalizeCode_(body.code);
  var twitchName = normalizeTwitch_(body.twitchName);
  var requestedId = String(body.id == null ? "" : body.id).trim();

  if (!code) {
    return { ok: false, error: "missing_code" };
  }
  if (!twitchName) {
    return { ok: false, error: "missing_twitch_name" };
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ctx = twitchContext_();
    var row = findRowByCode_(ctx, code);
    if (!row) {
      return { ok: false, error: "invalid_code" };
    }

    var petId = String(val_(ctx, row, "id") || "").trim();
    if (requestedId && petId && requestedId !== petId) {
      return { ok: false, error: "code_pet_mismatch" };
    }

    var existing = String(val_(ctx, row, "adopter") || "").trim();
    if (existing) {
      if (normalizeTwitch_(existing) === twitchName) {
        return { ok: true, already: true, id: petId, adopter: existing };
      }
      return { ok: false, error: "already_adopted" };
    }

    var owned = isOwnedNamed_(petId);
    if (!owned.ok) {
      return { ok: false, error: owned.error };
    }

    var adoptionId = String(val_(ctx, row, "adoptionId") || "").trim() || ("TW-" + petId);
    set_(ctx, row, "adopter", twitchName);
    set_(ctx, row, "twitchName", twitchName);
    set_(ctx, row, "adoptionId", adoptionId);
    set_(ctx, row, "deliveryStatus", "pending");
    set_(ctx, row, "adoptedAt", nowIso_());
    set_(ctx, row, "deliveredAt", "");
    set_(ctx, row, "deliveryAttempts", 0);
    set_(ctx, row, "lastError", "");
    set_(ctx, row, "processingAt", "");
    return { ok: true, id: petId, adopter: twitchName, adoptionId: adoptionId };
  } finally {
    lock.releaseLock();
  }
}

function claimNext_() {
  if (String(PropertiesService.getScriptProperties().getProperty("AUTOMATION_ENABLED") || "true").toLowerCase() === "false") {
    return { ok: true, empty: true, disabled: true };
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ctx = twitchContext_();
    var now = Date.now();
    var chosen = 0;
    for (var r = 2; r <= ctx.lastRow; r++) {
      var adopter = String(val_(ctx, r, "adopter") || "").trim();
      if (!adopter) {
        continue;
      }
      var status = String(val_(ctx, r, "deliveryStatus") || "").trim().toLowerCase();
      var attempts = Number(val_(ctx, r, "deliveryAttempts") || 0) || 0;
      var processingAt = Date.parse(String(val_(ctx, r, "processingAt") || "")) || 0;
      var stale = status === "processing" && processingAt && now - processingAt > STALE_PROCESSING_MS;
      var retryError = status === "error" && attempts < MAX_DELIVERY_ATTEMPTS;
      if (!(status === "pending" || status === "" || stale || retryError)) {
        continue;
      }

      var twitchName = normalizeTwitch_(val_(ctx, r, "twitchName") || val_(ctx, r, "adopter"));
      var saId = String(val_(ctx, r, "saId") || "").trim();
      if (!isSafeToken_(twitchName)) {
        set_(ctx, r, "deliveryStatus", "error");
        set_(ctx, r, "lastError", "invalid_twitch_name");
        set_(ctx, r, "deliveryAttempts", attempts + 1);
        continue;
      }
      if (!saId) {
        set_(ctx, r, "lastError", "falta saId");
        continue;
      }
      if (!isSafeAvatarId_(saId)) {
        set_(ctx, r, "lastError", "invalid_saId");
        continue;
      }
      chosen = r;
      break;
    }

    if (!chosen) {
      return { ok: true, empty: true, hint: "falta saId en la fila pending" };
    }

    var petId = String(val_(ctx, chosen, "id") || "").trim();
    var saId = String(val_(ctx, chosen, "saId") || "").trim();
    var adoptionId = String(val_(ctx, chosen, "adoptionId") || "").trim() || ("TW-" + petId);
    var twitchName = normalizeTwitch_(val_(ctx, chosen, "twitchName") || val_(ctx, chosen, "adopter"));

    set_(ctx, chosen, "adoptionId", adoptionId);
    set_(ctx, chosen, "twitchName", twitchName);
    set_(ctx, chosen, "deliveryStatus", "processing");
    set_(ctx, chosen, "processingAt", nowIso_());

    return {
      ok: true,
      adoptionId: adoptionId,
      twitchUsername: twitchName,
      streamAvatarsId: saId
    };
  } finally {
    lock.releaseLock();
  }
}

function confirm_(adoptionId) {
  var id = String(adoptionId || "").trim();
  if (!id) {
    return { ok: false, error: "missing_adoptionId" };
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ctx = twitchContext_();
    var row = findRowByAdoptionId_(ctx, id);
    if (!row) {
      return { ok: false, error: "not_found" };
    }
    var status = String(val_(ctx, row, "deliveryStatus") || "").toLowerCase();
    if (status === "delivered") {
      return { ok: true, already: true };
    }
    set_(ctx, row, "deliveryStatus", "delivered");
    set_(ctx, row, "deliveredAt", nowIso_());
    set_(ctx, row, "lastError", "");
    set_(ctx, row, "processingAt", "");
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function reportError_(adoptionId, message) {
  var id = String(adoptionId || "").trim();
  if (!id) {
    return { ok: false, error: "missing_adoptionId" };
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ctx = twitchContext_();
    var row = findRowByAdoptionId_(ctx, id);
    if (!row) {
      return { ok: false, error: "not_found" };
    }
    var status = String(val_(ctx, row, "deliveryStatus") || "").toLowerCase();
    if (status === "delivered") {
      return { ok: true, already: true };
    }
    var attempts = (Number(val_(ctx, row, "deliveryAttempts") || 0) || 0) + 1;
    set_(ctx, row, "deliveryStatus", "error");
    set_(ctx, row, "deliveryAttempts", attempts);
    set_(ctx, row, "lastError", String(message || "unknown").substring(0, 500));
    set_(ctx, row, "processingAt", "");
    return { ok: true, attempts: attempts };
  } finally {
    lock.releaseLock();
  }
}

function twitchContext_() {
    var ss = spreadsheet_();
  var sheet = ss.getSheetByName(TWITCH_SHEET_NAME);
  if (!sheet) {
    throw new Error("Missing TWITCH sheet");
  }
  ensureHeaders_(sheet);
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || "").trim();
  });
  var index = {};
  headers.forEach(function (h, i) {
    var key = h.toLowerCase();
    if (key && index[key] == null) {
      index[key] = i;
    }
  });
  return {
    sheet: sheet,
    headers: headers,
    index: index,
    lastRow: Math.max(sheet.getLastRow(), 1)
  };
}

function ensureHeaders_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || "").trim();
  });
  var saIdAt = 0;
  headers.forEach(function (h, i) {
    if (h.toLowerCase() === "said") {
      saIdAt = i + 1;
    }
  });
  if (saIdAt && saIdAt !== EXTRA_START_COL) {
    sheet.getRange(1, saIdAt, lastRow, EXTRA_HEADERS.length).moveTo(sheet.getRange(1, EXTRA_START_COL));
  }
  EXTRA_HEADERS.forEach(function (name, i) {
    var col = EXTRA_START_COL + i;
    var current = String(sheet.getRange(1, col).getValue() || "").trim();
    if (current.toLowerCase() !== name.toLowerCase()) {
      sheet.getRange(1, col).setValue(name);
    }
  });
}

function col_(ctx, name) {
  var idx = ctx.index[String(name).toLowerCase()];
  return idx == null ? -1 : idx;
}

function val_(ctx, row, name) {
  var c = col_(ctx, name);
  if (c < 0) {
    return "";
  }
  return ctx.sheet.getRange(row, c + 1).getValue();
}

function set_(ctx, row, name, value) {
  var c = col_(ctx, name);
  if (c < 0) {
    return;
  }
  ctx.sheet.getRange(row, c + 1).setValue(value);
}

function findRowByCode_(ctx, code) {
  var c = col_(ctx, "code");
  if (c < 0) {
    return 0;
  }
  var values = ctx.sheet.getRange(2, c + 1, Math.max(ctx.lastRow - 1, 1), 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (normalizeCode_(values[i][0]) === code) {
      return i + 2;
    }
  }
  return 0;
}

function findRowByAdoptionId_(ctx, adoptionId) {
  var c = col_(ctx, "adoptionId");
  if (c >= 0) {
    var values = ctx.sheet.getRange(2, c + 1, Math.max(ctx.lastRow - 1, 1), 1).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][0] || "").trim() === adoptionId) {
        return i + 2;
      }
    }
  }
  if (adoptionId.indexOf("TW-") === 0) {
    var idCol = col_(ctx, "id");
    var petId = adoptionId.slice(3);
    var ids = ctx.sheet.getRange(2, idCol + 1, Math.max(ctx.lastRow - 1, 1), 1).getValues();
    for (var j = 0; j < ids.length; j++) {
      if (String(ids[j][0] || "").trim() === petId) {
        return j + 2;
      }
    }
  }
  return 0;
}

function isOwnedNamed_(petId) {
    var ss = spreadsheet_();
  var main = ss.getSheets()[0];
  var lastCol = Math.max(main.getLastColumn(), 1);
  var headers = main.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || "").trim().toLowerCase();
  });
  var idCol = headers.indexOf("id");
  var statusCol = headers.indexOf("status");
  var nameCol = headers.indexOf("name");
  if (idCol < 0) {
    return { ok: false, error: "main_sheet_missing_id" };
  }
  var lastRow = Math.max(main.getLastRow(), 1);
  var ids = main.getRange(2, idCol + 1, Math.max(lastRow - 1, 1), 1).getValues();
  var row = -1;
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0] || "").trim() === String(petId)) {
      row = i + 2;
      break;
    }
  }
  if (row < 0) {
    return { ok: false, error: "pet_not_found" };
  }
  var status = statusCol < 0 ? "" : String(main.getRange(row, statusCol + 1).getValue() || "").trim().toUpperCase();
  var name = nameCol < 0 ? "" : String(main.getRange(row, nameCol + 1).getValue() || "").trim();
  if (status !== "OWNED") {
    return { ok: false, error: "not_owned" };
  }
  if (!name) {
    return { ok: false, error: "not_named" };
  }
  return { ok: true };
}

function checkSecret_(secret) {
  var expected = PropertiesService.getScriptProperties().getProperty("SHARED_SECRET");
  if (!expected) {
    return false;
  }
  return String(secret || "") === expected;
}

function normalizeCode_(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeTwitch_(value) {
  return String(value || "").trim().replace(/^@/, "").toLowerCase();
}

function isSafeToken_(value) {
  return /^[a-z0-9_]{3,25}$/i.test(String(value || ""));
}

function isSafeAvatarId_(value) {
  return /^[a-z0-9][a-z0-9_\-]{0,63}$/i.test(String(value || ""));
}

function nowIso_() {
  return new Date().toISOString();
}

function readBody_(e) {
  try {
    return JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return {};
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.TEXT);
}
