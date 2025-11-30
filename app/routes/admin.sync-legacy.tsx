import { json } from "@remix-run/node";
import { syncWithOriginalServer } from "~/db.server";

// One-time admin endpoint to sync legacy chains lookup table
// GET /admin/sync-legacy
export async function loader() {
  try {
    const result = await syncWithOriginalServer();
    return json({
      success: true,
      message: `Legacy sync complete`,
      added: result.added,
      skipped: result.skipped,
      total: result.total
    });
  } catch (error: any) {
    return json({
      success: false,
      error: error.message || 'Unknown error occurred',
      details: error.toString()
    }, { status: 500 });
  }
}
