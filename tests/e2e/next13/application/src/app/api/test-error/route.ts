import { logError } from "../../../../../../../../dist";

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
