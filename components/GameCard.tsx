import Image from "next/image";
import type { Goal, Broadcast } from "@/types/hockey";

type GameCardProps = {
  league: string;
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
  seriesStatus?: string;
  seriesGameNumber?: string;
  isFavoriteTeamGame?: boolean;
  goals?: Goal[];
  broadcasts?: Broadcast[];
};

export default function GameCard({
  league,
  awayTeam,
  homeTeam,
  awayAbbrev,
  homeAbbrev,
  awayLogo,
  homeLogo,
  time,
  status,
  awayScore,
  homeScore,
  seriesStatus,
  seriesGameNumber,
  isFavoriteTeamGame,
  goals,
  broadcasts,
}: GameCardProps) {
  const showScores =
    awayScore !== undefined &&
    homeScore !== undefined &&
    status !== "Preview";

  const isLive = status.toLowerCase().includes("live") || status.toLowerCase().includes("in progress");

  return (
    <div
  className={`rounded-2xl border bg-white/70 p-4 shadow-md backdrop-blur-sm ${
    isFavoriteTeamGame
      ? "border-yellow-400 ring-2 ring-yellow-300"
      : "border-slate-300"
  }`}
>
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-medium tracking-wide text-white ${
          league === "NHL" ? "bg-blue-700" : "bg-purple-700"
        }`}>
          {league}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
            {status}
          </span>
        ) : (
          <span className="text-sm text-slate-600">{status}</span>
        )}
      </div>

      <div className="mt-5 space-y-3">
  <div className="flex items-center justify-between rounded-xl bg-slate-100/80 px-4 py-3">
    <div className="flex items-center gap-3">
      {awayLogo ? (
        <Image
          src={awayLogo}
          alt={`${awayTeam} logo`}
          width={32}
          height={32}
          className="h-8 w-8"
        />
      ) : null}
      <span className="text-lg font-semibold text-slate-900">{awayAbbrev || awayTeam}</span>
    </div>

    {showScores ? (
      <span className="text-lg font-bold text-slate-900">{awayScore}</span>
    ) : null}
  </div>

  <div className="flex items-center justify-between rounded-xl bg-slate-100/80 px-4 py-3">
    <div className="flex items-center gap-3">
      {homeLogo ? (
        <Image
          src={homeLogo}
          alt={`${homeTeam} logo`}
          width={32}
          height={32}
          className="h-8 w-8"
        />
      ) : null}
      <span className="text-lg font-semibold text-slate-900">{homeAbbrev || homeTeam}</span>
    </div>

    {showScores ? (
      <span className="text-lg font-bold text-slate-900">{homeScore}</span>
    ) : null}
  </div>
</div>

{seriesStatus ? (
  <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
    <p className="font-semibold">{seriesStatus}</p>
    {seriesGameNumber ? (
      <p className="mt-1 text-slate-500">{seriesGameNumber}</p>
    ) : null}
  </div>
) : null}

{goals && goals.length > 0 ? (
  <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
      Scoring Summary ({goals.length} {goals.length === 1 ? 'Goal' : 'Goals'})
    </p>
    <div className="flex gap-3 overflow-x-auto pb-2">
      {goals.map((goal, index) => (
        <div
          key={index}
          className="flex-shrink-0 w-64 rounded-lg border-2 border-blue-500 bg-white p-3 text-sm"
        >
          {/* Header: Team, Period, Time */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
            <span className="font-bold text-blue-700">{goal.teamAbbrev || goal.team}</span>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">{goal.period}</span>
              <span className="text-slate-400">•</span>
              <span>{goal.time}</span>
            </div>
          </div>
          
          {/* Scorer */}
          <div className="mb-1">
            <p className="font-semibold text-slate-900">
              <span className="text-slate-600 text-xs font-normal mr-1">Goal:</span>
              {goal.scorer}
              {goal.strength && goal.strength !== "even" && (
                <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {goal.strength}
                </span>
              )}
            </p>
            {goal.shotType && (
              <p className="text-xs text-slate-500 mt-0.5">
                {goal.shotType.charAt(0).toUpperCase() + goal.shotType.slice(1)} shot
              </p>
            )}
          </div>
          
          {/* Assists */}
          {goal.assists && goal.assists.length > 0 && (
            <p className="text-xs text-slate-500">
              <span className="font-medium text-slate-600 mr-1">Assist(s):</span>
              {goal.assists.join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  </div>
) : null}

{broadcasts && broadcasts.length > 0 ? (
  <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
      Where to Watch
    </p>
    <div className="flex flex-wrap gap-2">
      {broadcasts.map((broadcast, index) => {
        const marketLabel = 
          broadcast.market === "N" ? "National" :
          broadcast.market === "H" ? "Home" :
          broadcast.market === "A" ? "Away" : "";
        
        return (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm shadow-sm border border-slate-200"
          >
            <span className="font-semibold text-slate-900">{broadcast.network}</span>
            <span className="text-xs text-slate-500">({broadcast.countryCode})</span>
            {marketLabel && (
              <span className="text-xs text-slate-400">• {marketLabel}</span>
            )}
          </span>
        );
      })}
    </div>
  </div>
) : null}

      <div className="mt-4 text-sm text-slate-600">{time}</div>
    </div>
  );
}