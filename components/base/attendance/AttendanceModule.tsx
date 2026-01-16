import React, { useEffect, useMemo, useState } from 'react';
import Button from '../../shared/ui/Button';
import { CalendarClock, RefreshCw } from 'lucide-react';

const API_URL = 'https://php.tdk.mybluehost.me/api/attendance.php';

interface AttendanceApiHeader {
  nameSpace?: string;
  nameAction?: string;
  version?: string;
  requestId?: string;
  timestamp?: string;
}

interface AttendanceEmployee {
  first_name?: string;
  last_name?: string;
  workno?: string;
  department?: string;
  job_title?: string;
}

interface AttendanceDevice {
  serial_number?: string;
  name?: string;
}

interface AttendanceApiRecord {
  uuid?: string;
  source?: number | string;
  checktype?: number | string;
  checktime?: string;
  address?: string;
  device?: AttendanceDevice;
  employee?: AttendanceEmployee;
}

interface AttendanceApiPayload {
  count?: number;
  page?: number | string;
  perPage?: number | string;
  pageCount?: number | string;
  list?: AttendanceApiRecord[];
}

interface AttendanceApiResponse {
  header?: AttendanceApiHeader;
  payload?: AttendanceApiPayload;
}

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const getCheckTypeLabel = (value?: number | string) => {
  if (value === 0 || value === '0') return 'In';
  if (value === 1 || value === '1') return 'Out';
  return value ? String(value) : '—';
};

const AttendanceModule: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return formatDateInput(start);
  });
  const [endDate, setEndDate] = useState(() => formatDateInput(new Date()));
  const [records, setRecords] = useState<AttendanceApiRecord[]>([]);
  const [payloadMeta, setPayloadMeta] = useState<AttendanceApiPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rangeLabel = useMemo(() => `${startDate} to ${endDate}`, [startDate, endDate]);

  const fetchAttendance = async (start: string, end: string, signal?: AbortSignal) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const url = new URL(API_URL);
      url.searchParams.set('start', start);
      url.searchParams.set('end', end);

      const response = await fetch(url.toString(), { signal });
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const data = (await response.json()) as AttendanceApiResponse;
      setRecords(data.payload?.list ?? []);
      setPayloadMeta(data.payload ?? null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to load attendance records.';
      setErrorMessage(message);
      setRecords([]);
      setPayloadMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void fetchAttendance(startDate, endDate, controller.signal);
    return () => controller.abort();
  }, [startDate, endDate]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarClock size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
            <p className="text-sm text-slate-500">Employee attendance records for {rangeLabel}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="inline-flex items-center gap-2"
          onClick={() => fetchAttendance(startDate, endDate)}
        >
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/50 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="attendance-start" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Start Date
              </label>
              <input
                id="attendance-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="attendance-end" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                End Date
              </label>
              <input
                id="attendance-end"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total: {payloadMeta?.count ?? records.length}
            </span>
            {payloadMeta?.pageCount ? (
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Page {payloadMeta.page ?? 1} of {payloadMeta.pageCount}
              </span>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
            Loading attendance records...
          </div>
        ) : errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
            No attendance records found for this date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-4">Employee</th>
                  <th className="py-3 pr-4">Department</th>
                  <th className="py-3 pr-4">Job Title</th>
                  <th className="py-3 pr-4">Check Type</th>
                  <th className="py-3 pr-4">Check Time</th>
                  <th className="py-3 pr-4">Device</th>
                  <th className="py-3 pr-4">Work No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((record, index) => {
                  const employee = record.employee ?? {};
                  const device = record.device ?? {};
                  const name = [employee.first_name, employee.last_name].filter(Boolean).join(' ') || '—';

                  return (
                    <tr key={record.uuid ?? `${record.checktime ?? 'attendance'}-${index}`} className="hover:bg-slate-50">
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-slate-800">{name}</div>
                        <div className="text-xs text-slate-400">{record.address || 'No location'}</div>
                      </td>
                      <td className="py-3 pr-4">{employee.department || '—'}</td>
                      <td className="py-3 pr-4">{employee.job_title || '—'}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {getCheckTypeLabel(record.checktype)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{formatDateTime(record.checktime)}</td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-700">{device.name || '—'}</div>
                        <div className="text-xs text-slate-400">{device.serial_number || '—'}</div>
                      </td>
                      <td className="py-3 pr-4">{employee.workno || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceModule;
