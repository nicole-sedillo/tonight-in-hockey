export type Goal = {
  period: string;
  time: string;
  team: string;
  teamAbbrev: string;
  scorer: string;
  assists?: string[];
  strength?: string;
  shotType?: string;
};

export type Broadcast = {
  network: string;
  market: string; // N=National, H=Home, A=Away
  countryCode: string;
  logoUrl?: string;
};

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
  goals?: Goal[];
  broadcasts?: Broadcast[];

  seriesStatus?: string;
  seriesGameNumber?: string;
};