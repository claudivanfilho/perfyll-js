import { logError } from "../../../../../../../../dist";
import { initServer } from "../../../../../../../../dist/server";

initServer({
  secret: process.env.PERFYLL_SECRET!,
  publicKey: process.env.NEXT_PUBLIC_PERFYLL_PUBLIC_KEY!,
  forceHttp: true, // It must be true because we are dealing with an edge function
  serviceName: "my-next-server",
  customHttpUrl: process.env.NEXT_PUBLIC_PERFYLL_CUSTOM_API_URL,
});

export async function GET() {
  try {
    throw new Error("My next13 error test");
  } catch (error) {
    logError(error, { framework: "next13", mode: "backend" });
    return Response.json({ message: (error as Error).message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return Response.json({});
}
