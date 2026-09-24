"use client";

import { useEffect, useState } from "react";
import GameCard from "@/components/GameCard";
import type { HockeyGame } from "@/types/hockey";
import { formatDate } from "@/utilities/date";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState("");
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [games, setGames] = useState<HockeyGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
  const today = new Date();

  setCurrentMonth(today);
  setSelectedDate(formatDate(today));
}, []);

  useEffect(() => {
    if (!selectedDate) return;

    async function fetchGames() {
  try {
    setLoading(true);
    setError("");
    setGames([]);

    const response = await fetch(`/api/nhl?date=${selectedDate}`);

    if (!response.ok) {
      throw new Error("Failed to load games");
    }

    const data = await response.json();

    console.log(data);
    setGames(data);
  } catch (err) {
    setError("Could not load games. Please try again.");
  } finally {
    setLoading(false);
  }
}

    fetchGames();
  }, [selectedDate]);

   function changeMonth(amount: number) {
  setCurrentMonth((current) => {
    if (!current) return current;

    const newMonth = new Date(current);

    newMonth.setMonth(newMonth.getMonth() + amount);

    return newMonth;
  });
}

  if (!currentMonth) {
  return <p>Loading calendar...</p>;
}

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = Array.from(
  { length: daysInMonth },
  (_, index) => index + 1
);

function selectDay(day: number) {
  const date = new Date(year, month, day);
  setSelectedDate(formatDate(date));
}

  return (
    
    <div>
      <h2>Game Calendar</h2>

      <div className="flex items-center justify-between mb-4">
  <button onClick={() => changeMonth(-1)}>
    ←
  </button>

  <h3>
    {currentMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}
  </h3>

  <button onClick={() => changeMonth(1)}>
    →
  </button>
</div>

<div className="grid grid-cols-7 text-center">
  <div>Sun</div>
  <div>Mon</div>
  <div>Tue</div>
  <div>Wed</div>
  <div>Thu</div>
  <div>Fri</div>
  <div>Sat</div>
</div>

<div className="grid grid-cols-7 text-center">
  {Array.from({ length: firstDayOfMonth }).map((_, index) => (
    <div key={`empty-${index}`} />
  ))}

  {days.map((day) => {
  const date = new Date(year, month, day);

  const formattedDate = formatDate(date);

  const isSelected = selectedDate === formattedDate;

  return (
    <button
      key={day}
      onClick={() => selectDay(day)}
      className={`cursor-pointer p-3 rounded-lg ${
        isSelected
          ? "bg-blue-600 text-white"
          : "hover:bg-slate-100"
      }`}
    >
      {day}
    </button>
  );
})}
</div>

<p>Days in month: {daysInMonth}</p>
<p>First day: {firstDayOfMonth}</p>

      <p>Selected date: {selectedDate}</p>

      {loading && <p>Loading games...</p>}

      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && selectedDate && games.length === 0 && (
        <p>No games scheduled for this date.</p>
      )}

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