"use client";

import { useEffect, useState } from "react";
import GameCard from "@/components/GameCard";
import type { HockeyGame } from "@/types/hockey";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState("");
  const [games, setGames] = useState<HockeyGame[]>([]);

  useEffect(() => {
    if (!selectedDate) return;

    async function fetchGames() {
      const response = await fetch(`/api/nhl?date=${selectedDate}`);
      const data = await response.json();

      console.log(data);
      setGames(data);
    }

    fetchGames();
  }, [selectedDate]);

  return (
    <div>
      <h2>Game Calendar</h2>

      <input
        type="date"
        value={selectedDate}
        onChange={(event) => setSelectedDate(event.target.value)}
      />

      <p>Selected date: {selectedDate}</p>

      {games.map((game) => (
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
        />
      ))}
    </div>
  );
}