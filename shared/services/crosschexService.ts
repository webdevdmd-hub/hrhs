import { CrosschexLog } from "../types";

const {
  VITE_CROSSCHEX_API_KEY,
  VITE_CROSSCHEX_API_SECRET,
  VITE_CROSSCHEX_BASE_URL
} = import.meta.env;

const BASE_URL = VITE_CROSSCHEX_BASE_URL || "https://api.us.i.com";

const requireCreds = () => {
  if (!VITE_CROSSCHEX_API_KEY || !VITE_CROSSCHEX_API_SECRET) {
    throw new Error("Missing CrossChex credentials. Set VITE_CROSSCHEX_API_KEY and VITE_CROSSCHEX_API_SECRET in .env");
  }
};

const makeRequestId = () => crypto.randomUUID();
const makeTimestamp = () => new Date().toISOString();

const normalizeLog = (item: any): CrosschexLog => {
  const employee = item.employee || item.payload?.list?.employee || {};
  const device = item.device || item.payload?.list?.device || {};
  return {
    userId: employee.workno || employee.workNo || item.user_id || item.userId || "",
    deviceId: device.serial_number || device.serialNumber,
    direction: item.checktype === 128 || String(item.checktype) === "128" ? "in" : "out",
    timestamp: item.checktime || item.checkTime || item.timestamp || item.time || "",
    raw: item
  };
};

export const crosschexService = {
  /**
   * Get auth token from CrossChex (authorize.token / token)
   */
  async getToken(): Promise<{ token: string; expires?: string }> {
    requireCreds();
    const body = {
      header: {
        nameSpace: "authorize.token",
        nameAction: "token",
        version: "1.0",
        requestId: makeRequestId(),
        timestamp: makeTimestamp()
      },
      payload: {
        api_key: VITE_CROSSCHEX_API_KEY,
        api_secret: VITE_CROSSCHEX_API_SECRET
      }
    };

    const res = await fetch(`${BASE_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok || json?.payload?.token == null) {
      throw new Error(`CrossChex token failed: ${json?.message || res.status}`);
    }
    return { token: json.payload.token, expires: json.payload.expires };
  },

  /**
   * Fetch paged attendance records (attendance.record / getrecord)
   */
  async getRecords({
    token,
    begin,
    end,
    page = 1,
    perPage = 100,
    order = "asc"
  }: {
    token: string;
    begin: string; // ISO with timezone, e.g. 2025-02-01T00:00:00+00:00
    end: string;   // ISO with timezone
    page?: number;
    perPage?: number;
    order?: "asc" | "desc";
  }): Promise<{ list: CrosschexLog[]; page: number; pageCount: number; count?: number }> {
    requireCreds();

    const body = {
      header: {
        nameSpace: "attendance.record",
        nameAction: "getrecord",
        version: "1.0",
        requestId: makeRequestId(),
        timestamp: makeTimestamp()
      },
      authorize: {
        type: "token",
        token
      },
      payload: {
        begin_time: begin,
        end_time: end,
        order,
        page,
        per_page: Math.min(perPage, 100)
      }
    };

    const res = await fetch(`${BASE_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const json = await res.json();
    if (json?.respondCode === "TOKEN_EXPIRES") {
      throw new Error("TOKEN_EXPIRES");
    }
    if (!res.ok) {
      throw new Error(`CrossChex getRecords failed: ${json?.message || res.status}`);
    }

    const listRaw = json?.payload?.list || json?.payload?.data || [];
    const list = Array.isArray(listRaw) ? listRaw.map(normalizeLog).filter(l => l.userId && l.timestamp) : [];
    return {
      list,
      page: json?.payload?.page || page,
      pageCount: json?.payload?.pageCount || json?.payload?.page_count || 1,
      count: json?.payload?.count
    };
  }
};
