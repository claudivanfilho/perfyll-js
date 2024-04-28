import { NextRequest } from "next/server";

import { startMark, logError, endMark } from "../../../../../../../../index";

export async function GET(req: NextRequest) {
  startMark("testNext14Back");
  try {
    return Response.json({ message: "ok" });
  } catch (error) {
    logError(error, { framework: "next14", mode: "backend" });
    return Response.json({ message: (error as Error).message }, { status: 500 });
  } finally {
    endMark("testNext14Back").send();
  }
}

export async function OPTIONS() {
  return Response.json({});
}
