import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "aihot-mvp",
    version: "0.1.0",
    api: "v1",
  });
}
