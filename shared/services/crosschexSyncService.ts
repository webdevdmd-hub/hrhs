import { attendanceService } from "./attendanceService";
import { crosschexService } from "./crosschexService";
import { AttendanceRecord, CrosschexLog, Employee } from "../types";

type ShiftRules = {
  shiftStart?: string; // HH:mm
  shiftEnd?: string;   // HH:mm
  graceMinutes?: number;
};

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const diffHours = (startIso?: string, endIso?: string) => {
  if (!startIso || !endIso) return 0;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Number(((end - start) / 1000 / 60 / 60).toFixed(2));
};

const groupLogsByUserDate = (logs: CrosschexLog[]) => {
  const grouped = new Map<string, CrosschexLog[]>();
  logs.forEach(log => {
    const date = new Date(log.timestamp).toISOString().slice(0, 10);
    const key = `${log.userId}__${date}`;
    const list = grouped.get(key) || [];
    list.push(log);
    grouped.set(key, list);
  });
  return grouped;
};

const resolveStatus = (checkIn?: string, checkOut?: string, rules?: ShiftRules) => {
  const shiftStart = rules?.shiftStart || "09:00";
  const shiftEnd = rules?.shiftEnd || "17:00";
  const grace = rules?.graceMinutes ?? 5;
  const startMinutes = toMinutes(shiftStart) + grace;
  const endMinutes = toMinutes(shiftEnd) - grace;

  let isLate = false;
  let isEarlyDeparture = false;

  if (checkIn) {
    const mins = toMinutes(new Date(checkIn).toISOString().slice(11, 16));
    isLate = mins > startMinutes;
  }
  if (checkOut) {
    const mins = toMinutes(new Date(checkOut).toISOString().slice(11, 16));
    isEarlyDeparture = mins < endMinutes;
  }

  return { status: "present" as AttendanceRecord["status"], isLate, isEarlyDeparture };
};

export const crosschexSyncService = {
  /**
   * Fetch logs from CrossChex and push into Firestore attendance.
   * Intended to run in a background job/Cloud Function.
   */
  async fetchAndSync({
    from,
    to,
    employees,
    shiftRules
  }: {
    from: string;
    to: string;
    employees: Employee[];
    shiftRules?: ShiftRules;
  }) {
    const logs = await crosschexService.fetchLogs(from, to);
    const grouped = groupLogsByUserDate(logs);
    const employeeByExternalId = new Map<string, Employee>();
    employees.forEach(emp => {
      if (emp.employeeId) employeeByExternalId.set(emp.employeeId, emp);
    });

    for (const [key, userLogs] of grouped.entries()) {
      const [externalUserId, date] = key.split("__");
      const employee = employeeByExternalId.get(externalUserId);
      if (!employee) continue; // skip unmatched

      const sorted = userLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const checkIn = sorted[0]?.timestamp;
      const checkOut = sorted[sorted.length - 1]?.timestamp;
      const totalHours = diffHours(checkIn, checkOut);
      const { status, isLate, isEarlyDeparture } = resolveStatus(checkIn, checkOut, shiftRules);

      const record: Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt"> = {
        userId: employee.userId || employee.id,
        date,
        checkIn,
        checkOut,
        status,
        totalHours,
        isLate,
        isEarlyDeparture,
        notes: "Synced from CrossChex",
        overtimeHours: undefined,
        approvedBy: undefined,
        approvalStatus: undefined,
        updatedBy: undefined
      };

      await attendanceService.upsert(record);
    }
  }
};
