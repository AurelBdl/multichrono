import type { Timer } from '../components/SortableTimer';

export function buildReportingScript(timers: Timer[], dateFrom: string, dateTo: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo) || dateFrom > dateTo) {
    throw new Error('Enter a valid date range.');
  }

  const now = Date.now();
  const rows = timers.flatMap(timer => {
    const date = timer.creationDate ? new Date(timer.creationDate) : new Date(now);
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (day < dateFrom || day > dateTo || !Number.isFinite(date.getTime())) return [];

    const elapsed = timer.time + (timer.isRunning && timer.startTime !== null ? now - timer.startTime : 0);
    const hours = Math.round(elapsed / 3600000 * 100) / 100;
    if (!Number.isFinite(hours)) throw new Error(`Invalid duration for “${timer.name}”.`);
    if (hours <= 0) return [];

    const missionId = Number(timer.missionId);
    const affairId = timer.affairId == null || String(timer.affairId).trim() === '' ? null : Number(timer.affairId);
    if (!Number.isSafeInteger(missionId) || missionId <= 0) {
      throw new Error(`Set a mission for “${timer.name}” before copying the script.`);
    }
    if (affairId !== null && (!Number.isSafeInteger(affairId) || affairId <= 0)) {
      throw new Error(`Invalid affair for “${timer.name}”.`);
    }
    return [{ day, message: timer.name, hours, affairId, missionId }];
  }).sort((a, b) => a.day.localeCompare(b.day));

  if (!rows.length) throw new Error('No timers with an exportable duration in this date range.');

  return String.raw`(async () => {
  const rows = ${JSON.stringify(rows, null, 2)};
  const token = localStorage.getItem("userToken");
  const collaboratorId = Number(localStorage.getItem("userCollaboratorId"));
  if (!token || !Number.isSafeInteger(collaboratorId) || collaboratorId <= 0) {
    return console.error("Missing token or collaborator: log in to Orisis before running this script.");
  }

  try {
    const AREA = /\/(Directory|Reporting|Account|Parameters|Plannings|Sale|Purchase|Management)\//;
    const seen = performance.getEntriesByType("resource").map(entry => entry.name).find(url => AREA.test(url));
    let API = seen ? seen.slice(0, seen.search(AREA) + 1) : null;
    if (!API) for (const src of [...document.scripts].map(script => script.src).filter(Boolean)) {
      try {
        const response = await fetch(src);
        if (!response.ok) continue;
        const code = await response.text();
        const match = code.match(/(https?:\/\/[^"'\x60\s]+?\/)["'\x60]?\s*,?\s*["'\x60]?Reporting\/PayrollEvent\/GetPayrollEvents/);
        if (match) { API = match[1]; break; }
      } catch { /* Keep detecting the API if a script is inaccessible. */ }
    }
    if (!API) API = prompt("Orisis API base URL (available in the Network tab):")?.trim();
    if (!API) return console.log("Cancelled: unknown API URL.");
    const apiUrl = new URL(API);
    if (!["https:", "http:"].includes(apiUrl.protocol) || apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
      throw new Error("Invalid API base URL.");
    }
    API = apiUrl.href.endsWith("/") ? apiUrl.href : apiUrl.href + "/";

    const headers = { Authorization: "Bearer " + token, "Content-Type": "application/json" };
    const call = async (method, path, body) => {
      const response = await fetch(API + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
      if (response.status === 401) throw new Error("Token expired: reload the Orisis page.");
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(method + " " + path + " → " + response.status + " " + JSON.stringify(data));
      return data;
    };

    const payrollEventId = 1;
    const plan = [], skipped = [];
    for (const day of [...new Set(rows.map(row => row.day))]) {
      const existing = await call("GET", "Reporting/ReportDetail/GetReportDetails?collaboratorIds=" + collaboratorId + "&startDate=" + day + "&endDate=" + encodeURIComponent(day + " 23:59:59"));
      if (!Array.isArray(existing)) throw new Error("Invalid response when reading reports.");
      for (const row of rows.filter(item => item.day === day)) {
        const index = existing.findIndex(item => (item.message || "") === row.message
          && Number(item.missionId) === row.missionId
          && (item.affairId == null ? null : Number(item.affairId)) === row.affairId
          && Number(item.payrollEventId) === payrollEventId
          && Math.abs(Number(item.duration) - row.hours) < 0.000001);
        if (index !== -1) {
          existing.splice(index, 1);
          skipped.push({ day, subject: row.message, reason: "Already exists" });
          continue;
        }
        plan.push({ id: 0, collaboratorId, payrollEventId, affairId: row.affairId, missionId: row.missionId,
          startDate: day + "T00:00:00", endDate: day + "T23:59:59", duration: row.hours, durationValue: row.hours, message: row.message, status: 0 });
      }
    }
    if (skipped.length) console.table(skipped);
    if (!plan.length) return console.log("Nothing to insert: reports already exist.");
    console.table(plan);
    const summary = plan.map(row => row.startDate.slice(0, 10) + " · " + row.message + " : " + row.duration.toFixed(2) + " h").join("\n");
    if (!confirm("Insert " + plan.length + " report(s) into " + API + " for collaborator " + collaboratorId + "?\n\n" + summary)) {
      return console.log("Cancelled. Nothing was written.");
    }
    const results = [];
    for (const dto of plan) {
      try {
        const response = await call("POST", "Reporting/ReportDetail/CreateReportDetail", dto);
        results.push({ day: dto.startDate.slice(0, 10), subject: dto.message, hours: dto.duration, action: "Created", id: response?.data?.id });
      } catch (error) {
        console.table(results);
        throw error;
      }
    }
    console.table(results);
    console.log("Done. Check your reports in Orisis.");
  } catch (error) {
    console.error("Export stopped:", error);
  }
})();`;
}
