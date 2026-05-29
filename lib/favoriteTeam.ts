export const FAVORITE_TEAMS_KEY = "favoriteTeams"; // Changed from "favoriteTeam" to "favoriteTeams"

// Get all favorite teams (returns an array)
export function getFavoriteTeams(): string[] {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem(FAVORITE_TEAMS_KEY);
  if (!stored) return []; // No teams saved yet
  
  try {
    return JSON.parse(stored); // Convert string back to array
  } catch {
    return []; // If parsing fails, return empty array
  }
}

// Add or remove a team (toggle)
export function toggleFavoriteTeam(teamKey: string) {
  const currentTeams = getFavoriteTeams();
  
  if (currentTeams.includes(teamKey)) {
    // Team is already selected, remove it
    const newTeams = currentTeams.filter(team => team !== teamKey);
    localStorage.setItem(FAVORITE_TEAMS_KEY, JSON.stringify(newTeams));
  } else {
    // Team not selected, add it
    const newTeams = [...currentTeams, teamKey];
    localStorage.setItem(FAVORITE_TEAMS_KEY, JSON.stringify(newTeams));
  }
}

// Clear all favorite teams
export function clearFavoriteTeams() {
  localStorage.removeItem(FAVORITE_TEAMS_KEY);
}