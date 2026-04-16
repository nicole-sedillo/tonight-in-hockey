import { NextResponse } from "next/server";
import { getPwhlGames } from "@/lib/pwhl";

export async function GET() {
  try {
    const games = await getPwhlGames();
    return NextResponse.json(games);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch PWHL games" },
      { status: 500 }
    );
  }
}