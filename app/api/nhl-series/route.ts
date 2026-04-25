import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(
    "https://api-web.nhle.com/v1/playoff-series/carousel/20252026",
    { next: { revalidate: 300 } }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch NHL series" },
      { status: 500 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}