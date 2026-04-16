export type HockeyGame = {
  id: string;
  league: "NHL" | "PWHL";
  awayTeam: string;
  homeTeam: string;
  awayAbbrev?: string;
  homeAbbrev?: string;
  awayLogo?: string;
  homeLogo?: string;
  time: string;
  status: string;
  awayScore?: number;
  homeScore?: number;
};