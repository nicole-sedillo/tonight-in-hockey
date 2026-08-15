"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import GameCard from "@/components/GameCard";
import type { HockeyGame } from "@/types/hockey";
import { getFavoriteTeams, toggleFavoriteTeam, clearFavoriteTeams } from "@/lib/favoriteTeam";
import { nhlTeams } from "@/lib/nhlTeams";
import { pwhlTeams } from "@/lib/pwhlTeams";
import { sendGameNotification } from "@/lib/notifications";



function scoreFeaturedGame(game: HockeyGame, favoriteTeams: string[]) {
  let score = 0;

  const homeKey = `${game.league}-${game.homeAbbrev}`;
  const awayKey = `${game.league}-${game.awayAbbrev}`;
  
  const isFavoriteTeamGame = 
    favoriteTeams.includes(homeKey) || 
    favoriteTeams.includes(awayKey);

  if (isFavoriteTeamGame) score += 50;

  if (game.status === "Live") score += 100;

  if (game.seriesStatus) score += 40;

  if (game.awayScore !== undefined && game.homeScore !== undefined) {
    const diff = Math.abs(game.awayScore - game.homeScore);

    if (diff === 0) score += 40;
    else if (diff === 1) score += 30;
    else if (diff === 2) score += 15;
  }

  if (game.seriesStatus?.includes("leads series 3-")) {
    score += 60;
  }

  if (game.status === "Preview") score += 20;

  if (game.status === "Final") score -= 30;

  return score;
}

function getFeaturedReason(game: HockeyGame) {
  const status = game.status?.toLowerCase() || "";
  const series = game.seriesStatus?.toLowerCase() || "";

  if (series.includes("leads series 3-")) {
    return "Potential series-clinching game";
  }

  if (
    status.includes("live") &&
    game.awayScore !== undefined &&
    game.homeScore !== undefined
  ) {
    const diff = Math.abs(game.awayScore - game.homeScore);

    if (diff <= 1) return "Live close game";
    return "Live now";
  }

  if (game.seriesStatus) {
    return game.seriesStatus;
  }

  if (status.includes("preview")) {
    return "Upcoming matchup";
  }

  if (status.includes("final")) {
    return "Final score";
  }

  return "Featured matchup";
}

export default function HomePage() {
  const [games, setGames] = useState<HockeyGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<"ALL" | "NHL" | "PWHL">("ALL");
  const [favoriteTeams, setFavoriteTeamsState] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [previousGameStates, setPreviousGameStates] = useState<Map<string, string>>(new Map());
  const [favExpanded, setFavExpanded] = useState(false);
  const formatDate = (date: Date) => {
    // Format in local timezone, not UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

const changeDate = (days: number) => {
  const newDate = new Date(selectedDate);
  newDate.setDate(newDate.getDate() + days);
  setSelectedDate(newDate);
};

const handleNotificationToggle = async () => {
  if (!('Notification' in window)) return;

  if (notificationsEnabled) {
    setNotificationsEnabled(false);
    localStorage.setItem('notificationsEnabled', 'false');
    return;
  }

  const permission =
    Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission;

  const enabled = permission === 'granted';
  setNotificationsEnabled(enabled);
  localStorage.setItem('notificationsEnabled', String(enabled));
};

useEffect(() => {
  async function loadGames() {
    try {
      setLoading(true);

      const date = formatDate(selectedDate);

      const [nhlRes, pwhlRes] = await Promise.all([
        fetch(`/api/nhl?date=${date}`),
        fetch(`/api/pwhl?date=${date}`),
      ]);

      const [nhlData, pwhlData] = await Promise.all([
        nhlRes.json(),
        pwhlRes.json(),
      ]);

      setGames([...(nhlData || []), ...(pwhlData || [])]);
    } catch (error) {
      console.error("Failed to load games:", error);
    } finally {
      setLoading(false);
    }
  }

  loadGames();
}, [selectedDate]);

  useEffect(() => {
  const savedTeams = getFavoriteTeams();
  setFavoriteTeamsState(savedTeams);

  const notifEnabled = localStorage.getItem('notificationsEnabled') === 'true';
  if (notifEnabled && Notification.permission === 'granted') {
    setNotificationsEnabled(true);
  }
  
}, []);

useEffect(() => {
  if (!notificationsEnabled || games.length === 0) return;

  const checkInterval = setInterval(() => {
    const now = new Date();
    
    games.forEach((game) => {
      // Only check games that haven't started yet
      if (game.status !== 'Preview') return;

      const gameTime = new Date(game.time);
      const minutesUntilGame = (gameTime.getTime() - now.getTime()) / 1000 / 60;

      // Notify 15 minutes before game starts
      if (minutesUntilGame <= 15 && minutesUntilGame > 14) {
        const homeKey = `${game.league}-${game.homeAbbrev}`;
        const awayKey = `${game.league}-${game.awayAbbrev}`;
        
        // Check if it's a favorite team game
        const isFavorite = 
          favoriteTeams.includes(homeKey) || 
          favoriteTeams.includes(awayKey);

        if (isFavorite || favoriteTeams.length === 0) {
          // Send notification (you'll create this function in Step 3)
          sendGameNotification(
            `${game.league} Game Starting Soon!`,
            `${game.awayAbbrev} @ ${game.homeAbbrev} starts in 15 minutes`,
            game.homeLogo || game.awayLogo
          );
        }
      }
    });
  }, 60000); // Check every minute

  return () => clearInterval(checkInterval);
}, [games, notificationsEnabled, favoriteTeams]);

useEffect(() => {
  if (!notificationsEnabled) return;

  games.forEach((game) => {
    const previousStatus = previousGameStates.get(game.id);
    
    // Detect when game goes from Preview to Live
    if (previousStatus === 'Preview' && game.status === 'Live') {
      const homeKey = `${game.league}-${game.homeAbbrev}`;
      const awayKey = `${game.league}-${game.awayAbbrev}`;
      
      const isFavorite = 
        favoriteTeams.includes(homeKey) || 
        favoriteTeams.includes(awayKey);

      if (isFavorite || favoriteTeams.length === 0) {
        sendGameNotification(
          `${game.league} Game Started!`,
          `${game.awayAbbrev} @ ${game.homeAbbrev} is now live!`,
          game.homeLogo || game.awayLogo
        );
      }
    }
  });

  // Update previous states
  const newStates = new Map();
  games.forEach(game => newStates.set(game.id, game.status));
  setPreviousGameStates(newStates);
}, [games, notificationsEnabled, favoriteTeams]);

  const filteredGames = games.filter((game) => {
  const matchesLeague =
    selectedLeague === "ALL" || game.league === selectedLeague;

  const homeKey = `${game.league}-${game.homeAbbrev}`;
  const awayKey = `${game.league}-${game.awayAbbrev}`;

  const matchesFavorite =
    !showOnlyFavorites ||
    favoriteTeams.length === 0 ||
    favoriteTeams.includes(homeKey) ||
    favoriteTeams.includes(awayKey);

    return matchesLeague && matchesFavorite;
});

const favoriteTeamGame = filteredGames.find((game) => {
  const homeKey = `${game.league}-${game.homeAbbrev}`;
  const awayKey = `${game.league}-${game.awayAbbrev}`;
  return (
    favoriteTeams.length > 0 &&
    (favoriteTeams.includes(homeKey) || favoriteTeams.includes(awayKey))
  );
});

const bestGame = filteredGames.length > 0
  ? [...filteredGames].sort(
      (a, b) => scoreFeaturedGame(b, favoriteTeams) - scoreFeaturedGame(a, favoriteTeams)
    )[0]
  : undefined;

const featuredGame = favoriteTeamGame ?? bestGame;

const remainingGames = filteredGames.filter(
  (game) => game.id !== featuredGame?.id
);

const allFavoriteTeams = [...nhlTeams, ...pwhlTeams];

  
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-slate-100 p-6 text-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/60 via-transparent to-blue-100/20"></div>
      {/* Center ice faceoff circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg width="1200" height="1200" viewBox="0 0 1200 1200" className="opacity-[0.12]">
          {/* Outer circle - red */}
          <circle cx="600" cy="600" r="400" fill="none" stroke="#dc2626" strokeWidth="6"/>
          {/* Inner faceoff circle */}
          <circle cx="600" cy="600" r="60" fill="none" stroke="#dc2626" strokeWidth="8"/>
          {/* Center dot */}
          <circle cx="600" cy="600" r="30" fill="#dc2626"/>
          {/* Faceoff hash marks */}
          <line x1="600" y1="170" x2="600" y2="230" stroke="#dc2626" strokeWidth="6" strokeLinecap="round"/>
          <line x1="600" y1="970" x2="600" y2="1030" stroke="#dc2626" strokeWidth="6" strokeLinecap="round"/>
          <line x1="170" y1="600" x2="230" y2="600" stroke="#dc2626" strokeWidth="6" strokeLinecap="round"/>
          <line x1="970" y1="600" x2="1030" y2="600" stroke="#dc2626" strokeWidth="6" strokeLinecap="round"/>
        </svg>
      </div>
      {/* Ice scratches */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="scratch-pattern" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
            <line x1="20" y1="50" x2="180" y2="65" stroke="#475569" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
            <line x1="100" y1="20" x2="250" y2="45" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
            <line x1="200" y1="80" x2="320" y2="110" stroke="#475569" strokeWidth="0.6" strokeLinecap="round" opacity="0.5"/>
            <line x1="50" y1="150" x2="140" y2="170" stroke="#64748b" strokeWidth="0.9" strokeLinecap="round" opacity="0.7"/>
            <line x1="280" y1="30" x2="370" y2="55" stroke="#475569" strokeWidth="1.1" strokeLinecap="round" opacity="0.3"/>
            <line x1="150" y1="120" x2="280" y2="135" stroke="#64748b" strokeWidth="0.7" strokeLinecap="round" opacity="0.6"/>
            <line x1="70" y1="200" x2="190" y2="230" stroke="#475569" strokeWidth="1.3" strokeLinecap="round" opacity="0.5"/>
            <line x1="250" y1="180" x2="340" y2="195" stroke="#64748b" strokeWidth="0.8" strokeLinecap="round" opacity="0.4"/>
            <line x1="30" y1="280" x2="150" y2="310" stroke="#475569" strokeWidth="1.0" strokeLinecap="round" opacity="0.6"/>
            <line x1="180" y1="260" x2="300" y2="275" stroke="#64748b" strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
            <line x1="320" y1="220" x2="390" y2="250" stroke="#475569" strokeWidth="0.7" strokeLinecap="round" opacity="0.7"/>
            <line x1="110" y1="330" x2="200" y2="345" stroke="#64748b" strokeWidth="1.1" strokeLinecap="round" opacity="0.4"/>
            <line x1="240" y1="310" x2="350" y2="340" stroke="#475569" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
            <line x1="60" y1="370" x2="170" y2="390" stroke="#64748b" strokeWidth="1.0" strokeLinecap="round" opacity="0.5"/>
            <line x1="290" y1="360" x2="380" y2="385" stroke="#475569" strokeWidth="0.9" strokeLinecap="round" opacity="0.3"/>
            <line x1="5" y1="100" x2="85" y2="115" stroke="#64748b" strokeWidth="0.6" strokeLinecap="round" opacity="0.6"/>
            <line x1="340" y1="140" x2="395" y2="160" stroke="#475569" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
            <line x1="130" y1="240" x2="220" y2="255" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#scratch-pattern)"/>
      </svg>
      <div className="mx-auto max-w-5xl relative z-10">
        
        <h1 className="mt-2 text-3xl text-slate-600">Find NHL and PWHL games</h1>

        <div className="mt-6 flex items-center justify-between gap-2">
          <div className="flex gap-2">
          <button
            onClick={() => setSelectedLeague("ALL")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all hover:scale-105 cursor-pointer ${
              selectedLeague === "ALL"
                ? "bg-slate-900 text-white shadow-md"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:shadow-md"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setSelectedLeague("NHL")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all hover:scale-105 cursor-pointer ${
              selectedLeague === "NHL"
                ? "bg-slate-900 text-white shadow-md"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:shadow-md"
            }`}
          >
            NHL
          </button>

          <button
            onClick={() => setSelectedLeague("PWHL")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all hover:scale-105 cursor-pointer ${
              selectedLeague === "PWHL"
                ? "bg-slate-900 text-white shadow-md"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:shadow-md"
            }`}
          >
            PWHL
          </button>
        </div>
        

        <button
          onClick={handleNotificationToggle}
          className={`mt-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            notificationsEnabled
              ? 'bg-green-600 text-white shadow-md hover:bg-green-700'
              : 'bg-white/60 text-slate-700 hover:bg-white/80 border border-slate-300'
          }`}
        >
          🔔 {notificationsEnabled ? 'Turn Off Notifications' : 'Enable Notifications'}
        </button>
      </div>

        <div className="mt-10 flex items-center justify-between gap-4 rounded-2xl border-t-4 border-b-4 border-x-0 border-t-blue-500 border-b-yellow-400 bg-white/80 p-4 shadow-sm">
          <button
            onClick={() => changeDate(-1)}
            className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md hover:scale-105 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Previous Day
          </button>
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-lg font-bold text-slate-900">
              {selectedDate.toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500">{formatDate(selectedDate)}</p>
              {formatDate(selectedDate) === formatDate(new Date()) && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  Today
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={() => changeDate(1)}
            className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md hover:scale-105 cursor-pointer"
          >
            Next Day
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        
          
        <div className="mt-12 mb-6 rounded-2xl border-t-4 border-b-4 border-x-0 border-t-blue-500 border-b-yellow-400 bg-white/80 p-4 shadow-sm">
  <div className="flex items-center justify-between gap-3">
  <button
    onClick={() => setFavExpanded((prev) => !prev)}
    className="flex flex-1 items-center gap-2 text-left"
  >
    <div>
      <h2 className="text-sm font-semibold text-slate-900">Which teams would you like to follow?</h2>
      <p className="text-xs text-slate-500">Choose team(s) to highlight their games.</p>
    </div>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`ml-1 h-6 w-6 shrink-0 text-slate-400 transition-transform duration-300 cursor-pointer ${favExpanded ? "rotate-180" : ""}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  </button>

  {favoriteTeams.length > 0 && (
    <button
      onClick={() => {
        setFavoriteTeamsState([]);
        clearFavoriteTeams();
      }}
      className="cursor-pointer rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
    >
      Clear favourite team(s)
    </button>
  )}
</div>

    
<div className={`overflow-hidden transition-all duration-300 ease-in-out ${favExpanded ? "mt-3 max-h-[600px]" : "max-h-0"}`}>
  <div className="space-y-5">
  <div>
    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
      NHL
    </h3>

    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
      {nhlTeams.map((team) => {
        const teamKey = `${team.league}-${team.abbrev}`;
        const isSelected = favoriteTeams.includes(teamKey); 

        return (
          <button
            key={teamKey}
            onClick={() => {
              toggleFavoriteTeam(teamKey);           
              const newTeams = getFavoriteTeams();   
              setFavoriteTeamsState(newTeams);       
            }}
            title={team.name}
            className={`flex flex-col items-center justify-center rounded-xl border p-2 transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
              isSelected
                ? "border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <img
              src={team.logo}
              alt={team.name}
              className="h-8 w-8 object-contain"
            />

            <span className="mt-1 text-[10px] font-semibold text-slate-700">
              {team.abbrev}
            </span>
          </button>
        );
      })}
    </div>
  </div>

  <div>
    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
      PWHL
    </h3>

    

    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
      {pwhlTeams.map((team) => {
        const teamKey = `${team.league}-${team.abbrev}`;
       const isSelected = favoriteTeams.includes(teamKey);

      return (
        <button
          key={teamKey}
          onClick={() => {
            toggleFavoriteTeam(teamKey);
            const newTeams = getFavoriteTeams();
            setFavoriteTeamsState(newTeams);
          }}
            title={team.name}
            className={`flex flex-col items-center justify-center rounded-xl border p-2 transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
              isSelected
                ? "border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <img
              src={team.logo}
              alt={team.name}
              className="h-8 w-8 object-contain"
            />

            <span className="mt-1 text-[10px] font-semibold text-slate-700">
              {team.abbrev}
            </span>
          </button>
        );
      })}
    </div>
  </div>
</div>
</div>
</div>

        {!loading && featuredGame ? (
          <section className="mt-12 rounded-3xl border-t-4 border-b-4 border-x-0 border-t-blue-500 border-b-yellow-400 bg-white/70 p-6 shadow-md backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {formatDate(selectedDate) === formatDate(new Date()) ? "Best Game Tonight" : "Best Game"}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  {featuredGame.awayAbbrev || featuredGame.awayTeam} at{" "}
                  {featuredGame.homeAbbrev || featuredGame.homeTeam}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                {getFeaturedReason(featuredGame)}
                </p>
              </div>

              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white">
                {featuredGame.status}
              </span>
              
            </div>

            

            <GameCard
              key={`featured-${featuredGame.id}`}
              league={featuredGame.league}
              awayTeam={featuredGame.awayTeam}
              homeTeam={featuredGame.homeTeam}
              awayAbbrev={featuredGame.awayAbbrev}
              homeAbbrev={featuredGame.homeAbbrev}
              awayLogo={featuredGame.awayLogo}
              homeLogo={featuredGame.homeLogo}
              time={featuredGame.time}
              status={featuredGame.status}
              awayScore={featuredGame.awayScore}
              homeScore={featuredGame.homeScore}
              seriesStatus={featuredGame.seriesStatus}
              seriesGameNumber={featuredGame.seriesGameNumber}
              goals={featuredGame.goals}
              broadcasts={featuredGame.broadcasts}
              isFavoriteTeamGame={
                favoriteTeams.some(ft => {
                  const abbrev = ft.split('-')[1];
                  return featuredGame.awayAbbrev === abbrev || featuredGame.homeAbbrev === abbrev;
                })
              }
                            
            />
          </section>
        ) : null}

        

        {loading ? (
          <div className="mt-12 rounded-2xl border-t-4 border-b-4 border-x-0 border-t-blue-500 border-b-yellow-400 bg-white/70 backdrop-blur-sm p-6 text-slate-600 shadow-md">
            Loading games...
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="mt-12 rounded-2xl border-t-4 border-b-4 border-x-0 border-t-blue-500 border-b-yellow-400 bg-white/70 backdrop-blur-sm p-6 text-slate-600 shadow-md">
            No games found.
          </div>
        ) : remainingGames.length === 0 ? null : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {remainingGames.map((game) => {
              const isFavoriteTeamGame =
              favoriteTeams.some(ft => {
                const abbrev = ft.split('-')[1];
                return game.awayAbbrev === abbrev || game.homeAbbrev === abbrev;
              })

              return (
                <GameCard
                  key={game.id}
                  league={game.league}
                  awayTeam={game.awayTeam}
                  homeTeam={game.homeTeam}
                  awayAbbrev={game.awayAbbrev}
                  homeAbbrev={game.homeAbbrev}
                  awayLogo={game.awayLogo}
                  homeLogo={game.homeLogo}
                  time={game.time}
                  status={game.status}
                  awayScore={game.awayScore}
                  homeScore={game.homeScore}
                  seriesStatus={game.seriesStatus}
                  seriesGameNumber={game.seriesGameNumber}
                  goals={game.goals}
                  broadcasts={game.broadcasts}
                  isFavoriteTeamGame={!!isFavoriteTeamGame}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}