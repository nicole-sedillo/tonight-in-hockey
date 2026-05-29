import { NextResponse } from "next/server";
import { getNhlGames } from "@/lib/nhl";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const games = await getNhlGames(date || undefined);
    return NextResponse.json(games);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch NHL games" },
      { status: 500 }
    );
  }
}