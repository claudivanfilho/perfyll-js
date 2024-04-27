import { NextRequest } from "next/server";
import { startMark, logError, endMark } from "../../../../../../../../dist";
import { initServer } from "../../../../../../../../dist/server";

initServer({
  publicKey: process.env.NEXT_PUBLIC_PERFYLL_PUBLIC_KEY!,
  secret: process.env.PERFYLL_SECRET!,
  forceHttp: true, // It must be true because we are dealing with an edge function
  serviceName: "my-next-server",
  customHttpUrl: process.env.NEXT_PUBLIC_PERFYLL_CUSTOM_API_URL,
});

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
