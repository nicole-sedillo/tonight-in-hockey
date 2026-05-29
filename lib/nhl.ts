import type { HockeyGame, Goal, Broadcast } from "@/types/hockey";
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

async function fetchNhlGameGoals(gameId: string): Promise<Goal[]> {
  try {
    const res = await fetch(
      `https://api-web.nhle.com/v1/gamecenter/${gameId}/play-by-play`,
      { next: { revalidate: 300 } } // 5 minutes cache for completed games
    );

    if (!res.ok) {
      console.warn(`Unable to fetch goals for game ${gameId}`);
      return [];
    }

    const data = await res.json();
    
    // Build player lookup from rosterSpots
    const playerLookup: Record<number, string> = {};
    const rosterSpots = data?.rosterSpots ?? [];
    for (const player of rosterSpots) {
      if (player.playerId) {
        const name = player.name?.default || 
                     `${player.firstName?.default || ""} ${player.lastName?.default || ""}`.trim() ||
                     "Unknown";
        playerLookup[player.playerId] = name;
      }
    }
    
    // Get goals from plays array
    const plays = data?.plays ?? [];
    const goalPlays = plays.filter((play: any) => play.typeDescKey === "goal");
    
    return goalPlays.map((play: any) => {
      const periodNumber = play.periodDescriptor?.number || 1;
      const timeInPeriod = play.timeInPeriod || "0:00";
      const details = play.details || {};
      
      // Get scorer name from player lookup
      const scorerId = details.scoringPlayerId;
      const scorerName = scorerId ? playerLookup[scorerId] || "Unknown" : "Unknown";
      
      // Get assists
      const assists: string[] = [];
      if (details.assist1PlayerId) {
        const assist1Name = playerLookup[details.assist1PlayerId];
        if (assist1Name) assists.push(assist1Name);
      }
      if (details.assist2PlayerId) {
        const assist2Name = playerLookup[details.assist2PlayerId];
        if (assist2Name) assists.push(assist2Name);
      }
      
      // Determine strength from situation code
      // First digit: away skaters, second: home skaters
      const situationCode = details.situationCode || "";
      let strengthDisplay = undefined;
      
      // PP/SH detection based on which team scored
      const awayScore = details.awayScore ?? 0;
      const homeScore = details.homeScore ?? 0;
      const isAwayGoal = play.previousAwayScore !== undefined ? 
                         awayScore > play.previousAwayScore : 
                         awayScore > homeScore;
      
      if (situationCode.length >= 2) {
        const awaySkaters = parseInt(situationCode[0]);
        const homeSkaters = parseInt(situationCode[1]);
        
        if (isAwayGoal && awaySkaters > homeSkaters) {
          strengthDisplay = "PP";
        } else if (isAwayGoal && awaySkaters < homeSkaters) {
          strengthDisplay = "SH";
        } else if (!isAwayGoal && homeSkaters > awaySkaters) {
          strengthDisplay = "PP";
        } else if (!isAwayGoal && homeSkaters < awaySkaters) {
          strengthDisplay = "SH";
        }
      }
      
      // Get team abbreviation
      const teamId = details.eventOwnerTeamId;
      const awayTeamId = data.awayTeam?.id;
      const homeTeamId = data.homeTeam?.id;
      const teamAbbrev = teamId === awayTeamId ? 
                         (data.awayTeam?.abbrev || "") : 
                         (data.homeTeam?.abbrev || "");
      
      return {
        period: `P${periodNumber}`,
        time: timeInPeriod,
        team: "",
        teamAbbrev,
        scorer: scorerName,
        assists: assists.length > 0 ? assists : undefined,
        strength: strengthDisplay,
      };
    });
  } catch (error) {
    console.error(`Failed to fetch goals for game ${gameId}:`, error);
    return [];
  }
}

export async function getNhlGames(date?: string): Promise<HockeyGame[]> {
  const targetDate = date || new Date().toLocaleDateString("en-CA");

  const res = await fetch(`https://api-web.nhle.com/v1/schedule/${targetDate}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch NHL schedule");
  }

  const data = await res.json();

  const playoffSeries = await getNhlPlayoffSeries();

  const gameWeek = data.gameWeek ?? [];

  const todayBlock = gameWeek.find((day: any) => day.date === targetDate);

  const games = todayBlock?.games ?? [];

  const gamesWithGoals = await Promise.all(
    games.map(async (game: any) => {
      const awayAbbrev =
        game.awayTeam?.abbrev?.default ||
        game.awayTeam?.abbrev ||
        "AWY";

      const homeAbbrev =
        game.homeTeam?.abbrev?.default ||
        game.homeTeam?.abbrev ||
        "HME";

      const series = getSeriesForGame(playoffSeries, awayAbbrev, homeAbbrev);
      const gameStatus = formatGameStatus(game.gameState);
      
      // Fetch goals for games that have started or completed
      // This includes live games and all finished games (past or current date)
      const shouldFetchGoals = 
        gameStatus === "Live" || 
        gameStatus === "Final" ||
        (game.awayTeam?.score !== undefined && game.homeTeam?.score !== undefined);
      
      const goals = shouldFetchGoals ? await fetchNhlGameGoals(game.id) : [];

      // Extract TV broadcasts
      const broadcasts: Broadcast[] = (game.tvBroadcasts || []).map((broadcast: any) => ({
        network: broadcast.network || "Unknown",
        market: broadcast.market || "",
        countryCode: broadcast.countryCode || "",
      }));

      return {
        id: String(game.id),
        league: "NHL" as const,
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
        status: gameStatus,
        awayScore: game.awayTeam?.score,
        homeScore: game.homeTeam?.score,
        goals,
        broadcasts,
        seriesStatus: formatSeriesStatus(series),
        seriesGameNumber: series ? `Best of ${series.neededToWin * 2 - 1}` : undefined,
      };
    })
  );

  return gamesWithGoals;
}