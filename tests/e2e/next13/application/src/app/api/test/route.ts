import { NextRequest } from "next/server";
import { startMark, logError, endMark } from "../../../../../../../../dist";

export async function GET(req: NextRequest) {
  startMark("testNext13Back");
  try {
    return Response.json({ message: "ok" });
  } catch (error) {
    logError(error, { framework: "next13", mode: "backend" });
    return Response.json({ message: (error as Error).message }, { status: 500 });
  } finally {
    endMark("testNext13Back").send();
  }
}

export async function OPTIONS() {
  return Response.json({});
}
