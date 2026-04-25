import type { HockeyGame } from "@/types/hockey";
import { NHL_TEAM_LOGOS } from "@/lib/teamLogos";

type NhlSeries = {
  topSeed: {
    abbrev: string;
    wins: number;
  };
  bottomSeed: {
    abbrev: string;
    wins: number;
  };
  neededToWin: number;
};

async function getNhlPlayoffSeries(): Promise<NhlSeries[]> {
  const res = await fetch(
    "https://api-web.nhle.com/v1/playoff-series/carousel/20252026",
    { next: { revalidate: 300 } }
  );

  if (!res.ok) return [];

  const data = await res.json();

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.series)) return data.series;
  if (Array.isArray(data.rounds)) {
    return data.rounds.flatMap((round: any) => round.series ?? []);
  }
  if (Array.isArray(data.rounds?.[0]?.series)) {
    return data.rounds.flatMap((round: any) => round.series);
  }

  return [];
}

function getSeriesForGame(
  series: NhlSeries[],
  awayAbbrev: string,
  homeAbbrev: string
) {
  if (!Array.isArray(series)) return undefined;

  return series.find((item) => {
    const teams = [item.topSeed?.abbrev, item.bottomSeed?.abbrev];
    return teams.includes(awayAbbrev) && teams.includes(homeAbbrev);
  });
}

function formatSeriesStatus(series?: NhlSeries) {
  if (!series) return undefined;

  const topWins = Number(series.topSeed.wins);
  const bottomWins = Number(series.bottomSeed.wins);

  if (topWins === bottomWins) {
    return `Series tied ${topWins}-${bottomWins}`;
  }

  const leader =
    topWins > bottomWins ? series.topSeed.abbrev : series.bottomSeed.abbrev;

  const leaderWins = Math.max(topWins, bottomWins);
  const trailingWins = Math.min(topWins, bottomWins);

  return `${leader} leads series ${leaderWins}-${trailingWins}`;
}

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

  const playoffSeries = await getNhlPlayoffSeries();

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

  const series = getSeriesForGame(playoffSeries, awayAbbrev, homeAbbrev);

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
    seriesStatus: formatSeriesStatus(series),
    seriesGameNumber: series ? `Best of ${series.neededToWin * 2 - 1}` : undefined,
  };
});
}