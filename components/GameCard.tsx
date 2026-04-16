import Image from "next/image";

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
}: GameCardProps) {
  const showScores =
    awayScore !== undefined &&
    homeScore !== undefined &&
    status !== "Preview";

  const isLive = status.toLowerCase().includes("live") || status.toLowerCase().includes("in progress");

  return (
    <div className="rounded-2xl border border-slate-300 bg-white/70 backdrop-blur-sm p-5 shadow-md">
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
    ) : (
      <span className="text-slate-400">@</span>
    )}
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
    ) : (
      <span className="text-slate-400">vs</span>
    )}
  </div>
</div>

      <div className="mt-4 text-sm text-slate-600">{time}</div>
    </div>
  );
}