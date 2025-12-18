/**
 * Node/ts-node entry point to run a CrossChex sync manually or via cron.
 * Usage:
 *   npx ts-node scripts/runCrosschexSync.ts 2025-02-01 2025-02-01
 *
 * Ensure env vars are set:
 *   VITE_CROSSCHEX_API_KEY
 *   VITE_CROSSCHEX_API_SECRET
 *   VITE_CROSSCHEX_BASE_URL (optional, defaults to US)
 * And Firebase envs for Firestore access.
 */
import { runCrosschexSync } from "../shared/services/crosschexJob";

const [,, fromArg, toArg] = process.argv;

if (!fromArg || !toArg) {
  console.error("Usage: ts-node scripts/runCrosschexSync.ts <from YYYY-MM-DD> <to YYYY-MM-DD>");
  process.exit(1);
}

(async () => {
  try {
    await runCrosschexSync({
      from: fromArg,
      to: toArg,
      shiftRules: { shiftStart: "08:30", shiftEnd: "18:00", graceMinutes: 15 }
    });
    console.log(`CrossChex sync complete for ${fromArg} to ${toArg}`);
    process.exit(0);
  } catch (err) {
    console.error("CrossChex sync failed", err);
    process.exit(1);
  }
})();
