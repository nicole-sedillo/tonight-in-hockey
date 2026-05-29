import type { HockeyGame } from "@/types/hockey";

function formatGameTime(rawDate: string, fallbackTime?: string) {
  if (rawDate) {
    return new Date(rawDate).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return fallbackTime || "TBD";
}

function formatPwhlStatus(status: string) {
  const normalized = status?.toLowerCase?.() || "";

  if (normalized.includes("live")) return "Live";
  if (normalized.includes("final")) return "Final";
  return "Preview";
}

export async function getPwhlGames(date?: string): Promise<HockeyGame[]> {
  const targetDate = date || new Date().toLocaleDateString("en-CA");

  const url =
    `https://lscluster.hockeytech.com/feed/index.php` +
    `?feed=modulekit` +
    `&view=scorebar` +
    `&numberofdaysback=30` +
    `&numberofdaysahead=30` +
    `&key=446521baf8c38984` +
    `&client_code=pwhl` +
    `&fmt=json`;

  const res = await fetch(url, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch PWHL games");
  }

  const data = await res.json();

  const allGames = data?.SiteKit?.Scorebar ?? [];

  const todaysGames = allGames.filter((game: any) => game.Date === targetDate);

  return todaysGames.map((game: any) => ({
    id: String(game.ID),
    league: "PWHL" as const,
    awayTeam: game.VisitorLongName || "Away",
    homeTeam: game.HomeLongName || "Home",
    awayAbbrev: game.VisitorCode || "AWY",
    homeAbbrev: game.HomeCode || "HME",
    awayLogo: game.VisitorLogo || undefined,
    homeLogo: game.HomeLogo || undefined,
    time: formatGameTime(game.GameDateISO8601, game.ScheduledFormattedTime),
    status: formatPwhlStatus(game.GameStatusString || ""),
    awayScore:
      game.VisitorGoals !== undefined ? Number(game.VisitorGoals) : undefined,
    homeScore:
      game.HomeGoals !== undefined ? Number(game.HomeGoals) : undefined,
    goals: [], // PWHL goal tracking not yet implemented
    broadcasts: [], // PWHL broadcast data not available in API
  }));
}