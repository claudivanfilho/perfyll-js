import { logError } from "../../../../../../../../index";

export async function GET() {
  try {
    throw new Error("My next14 error test");
  } catch (error) {
    logError(error, { framework: "next14", mode: "backend" });
    return Response.json({ message: (error as Error).message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return Response.json({});
}
