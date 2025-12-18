import { CrosschexLog } from "../types";

const { VITE_CROSSCHEX_API_BASE, VITE_CROSSCHEX_PROXY_KEY } = import.meta.env;

const normalize = (item: any): CrosschexLog => {
  const employee = item.employee || {};
  const device = item.device || {};
  return {
    userId: employee.workno || employee.workNo || item.workno || item.workNo || "",
    deviceId: device.serial_number || device.serialNumber,
    direction: item.checktype === 128 || String(item.checktype) === "128" ? "in" : (item.direction || "in"),
    timestamp: item.checktime || item.checkTime || item.time || "",
    raw: item
  };
};

export const crosschexProxyService = {
  /**
   * Fetch CrossChex attendance via a proxy/backend to avoid CORS.
   * Expects the proxy to expose GET /api/attendance?start&end&page&per_page[&workno]
   */
  async fetchAttendance({
    start,
    end,
    page = 1,
    perPage = 50,
    workno
  }: {
    start: string;
    end: string;
    page?: number;
    perPage?: number;
    workno?: string;
  }): Promise<{ list: CrosschexLog[]; page: number; pageCount: number; count?: number }> {
    if (!VITE_CROSSCHEX_API_BASE) {
      throw new Error("Missing VITE_CROSSCHEX_API_BASE for proxy");
    }
    const url = new URL("/api/attendance", VITE_CROSSCHEX_API_BASE);
    url.searchParams.set("start", start);
    url.searchParams.set("end", end);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    if (workno) url.searchParams.set("workno", workno);

    const res = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        ...(VITE_CROSSCHEX_PROXY_KEY ? { "x-api-key": VITE_CROSSCHEX_PROXY_KEY } : {})
      }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Proxy attendance fetch failed (${res.status})`);
    }
    const json = await res.json();
    const rawList = json?.payload?.list || json?.list || [];
    return {
      list: Array.isArray(rawList) ? rawList.map(normalize).filter(l => l.userId && l.timestamp) : [],
      page: json?.payload?.page || json?.page || page,
      pageCount: json?.payload?.pageCount || json?.pageCount || 1,
      count: json?.payload?.count || json?.count
    };
  }
};

export default crosschexProxyService;
