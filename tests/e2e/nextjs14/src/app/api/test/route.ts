import { NextRequest } from "next/server";
import { init, startMark, logError, endMark } from "../../../../../../../index";

init({ publicKey: "" });

export async function GET(req: NextRequest) {
  startMark("testMark");
  try {
    return Response.json({ message: "ok" });
  } catch (error) {
    logError(error);
    return Response.json({ message: (error as Error).message }, { status: 500 });
  } finally {
    endMark("testMark").send();
  }
}

export async function OPTIONS() {
  return Response.json({});
}
