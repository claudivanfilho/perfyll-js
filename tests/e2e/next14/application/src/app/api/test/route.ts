import { NextRequest } from "next/server";

import { startMark, logError, endMark } from "../../../../../../../../index";
import { initServer } from "../../../../../../../../server/index";

initServer({
  secret: process.env.PERFYLL_SECRET!,
  publicKey: process.env.NEXT_PUBLIC_PERFYLL_PUBLIC_KEY!,
  forceHttp: true, // It must be true because we are dealing with an edge function
  serviceName: "my-next-server",
  customHttpUrl: process.env.NEXT_PUBLIC_PERFYLL_CUSTOM_API_URL,
});

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
