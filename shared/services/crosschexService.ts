/**
 * CrossChex Cloud API client.
 * Fetches attendance logs from biometric devices.
 *
 * API credentials are loaded from environment variables:
 * - VITE_CROSSCHEX_API_KEY
 * - VITE_CROSSCHEX_API_SECRET
 * - VITE_CROSSCHEX_BASE_URL (optional, defaults to US region)
 *
 * IMPORTANT: Do not commit secrets. Store them in .env and configure your cloud
 * function runtime with the same names (process.env.* on the server).
 */
import { CrosschexLog } from "../types";

const {
  VITE_CROSSCHEX_API_KEY,
  VITE_CROSSCHEX_API_SECRET,
  VITE_CROSSCHEX_BASE_URL
} = import.meta.env;

const BASE_URL = VITE_CROSSCHEX_BASE_URL || "https://us.crosschexcloud.com";
const ATTENDANCE_PATH = "/openapi/attendance/list"; // Replace with the exact path your account requires

const requireCreds = () => {
  if (!VITE_CROSSCHEX_API_KEY || !VITE_CROSSCHEX_API_SECRET) {
    throw new Error("Missing CrossChex credentials. Set VITE_CROSSCHEX_API_KEY and VITE_CROSSCHEX_API_SECRET in .env");
  }
};

const normalizeLog = (item: any): CrosschexLog => ({
  userId: item.user_id || item.userId || "",
  deviceId: item.device_id || item.deviceId,
  direction: (item.direction || item.type || "").toLowerCase() === "out" ? "out" : "in",
  timestamp: item.punch_time || item.checkTime || item.timestamp || item.time || "",
  raw: item
});

export const crosschexService = {
  /**
   * Fetch attendance logs for a date range (inclusive).
   * @param from ISO date string YYYY-MM-DD
   * @param to ISO date string YYYY-MM-DD
   */
  async fetchLogs(from: string, to: string): Promise<CrosschexLog[]> {
    requireCreds();

    const url = `${BASE_URL}${ATTENDANCE_PATH}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": VITE_CROSSCHEX_API_KEY!,
        "X-API-SECRET": VITE_CROSSCHEX_API_SECRET!
      },
      body: JSON.stringify({ from, to })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`CrossChex fetch failed (${res.status}): ${text}`);
    }

    const payload = await res.json();
    const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    return items.map(normalizeLog).filter(l => l.userId && l.timestamp);
  }
};
