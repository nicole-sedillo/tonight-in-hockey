import type { HockeyGame } from "@/types/hockey";
import { NHL_TEAM_LOGOS } from "@/lib/teamLogos";

function formatGameTime(startTimeUTC: string) {
  if (!startTimeUTC) return "TBD";

  return new Date(startTimeUTC).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatGameStatus(gameState: string) {
  switch (gameState) {
    case "LIVE":
    case "CRIT":
      return "Live";
    case "OFF":
    case "FINAL":
      return "Final";
    case "FUT":
    case "PRE":
    default:
      return "Preview";
  }
}

export async function getNhlGames(): Promise<HockeyGame[]> {
  const today = new Date().toLocaleDateString("en-CA");

  const res = await fetch(`https://api-web.nhle.com/v1/schedule/${today}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch NHL schedule");
  }

  const data = await res.json();

  const gameWeek = data.gameWeek ?? [];

  const todayBlock = gameWeek.find((day: any) => day.date === today);

  const games = todayBlock?.games ?? [];

  return games.map((game: any) => {
  const awayAbbrev =
    game.awayTeam?.abbrev?.default ||
    game.awayTeam?.abbrev ||
    "AWY";

  const homeAbbrev =
    game.homeTeam?.abbrev?.default ||
    game.homeTeam?.abbrev ||
    "HME";

  return {
    id: String(game.id),
    league: "NHL",
    awayTeam:
      game.awayTeam?.placeName?.default ||
      game.awayTeam?.name?.default ||
      "Away",
    homeTeam:
      game.homeTeam?.placeName?.default ||
      game.homeTeam?.name?.default ||
      "Home",
    awayAbbrev,
    homeAbbrev,
    awayLogo: NHL_TEAM_LOGOS[awayAbbrev],
    homeLogo: NHL_TEAM_LOGOS[homeAbbrev],
    time: formatGameTime(game.startTimeUTC),
    status: formatGameStatus(game.gameState),
    awayScore: game.awayTeam?.score,
    homeScore: game.homeTeam?.score,
  };
});
}