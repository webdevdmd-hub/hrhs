/**
 * Convenience runner to sync CrossChex logs into Firestore attendance.
 * Intended to be called from a cron/Cloud Function/Lambda, not from the browser.
 *
 * Example (server-side):
 *   import { runCrosschexSync } from './shared/services/crosschexJob';
 *   await runCrosschexSync({ from: '2025-02-01', to: '2025-02-01' });
 */
import { crosschexSyncService } from "./crosschexSyncService";
import { employeeService } from "./employeeService";
import { ShiftRules } from "./crosschexSyncService";

export const runCrosschexSync = async ({
  from,
  to,
  shiftRules
}: {
  from: string;
  to: string;
  shiftRules?: ShiftRules;
}) => {
  const employees = await employeeService.getAllEmployees();
  await crosschexSyncService.fetchAndSync({
    from,
    to,
    employees,
    shiftRules
  });
};

export default runCrosschexSync;
