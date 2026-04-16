import { NextResponse } from "next/server";
import { getNhlGames } from "@/lib/nhl";

export async function GET() {
  try {
    const games = await getNhlGames();
    return NextResponse.json(games);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch NHL games" },
      { status: 500 }
    );
  }
}