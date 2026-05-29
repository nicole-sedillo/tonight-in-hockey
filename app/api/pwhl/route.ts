import { NextResponse } from "next/server";
import { getPwhlGames } from "@/lib/pwhl";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const games = await getPwhlGames(date || undefined);
    return NextResponse.json(games);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch PWHL games" },
      { status: 500 }
    );
  }
}