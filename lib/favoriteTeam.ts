export const FAVORITE_TEAM_KEY = "favoriteTeam";

export function getFavoriteTeam() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(FAVORITE_TEAM_KEY);
}

export function setFavoriteTeam(teamAbbrev: string) {
  localStorage.setItem(FAVORITE_TEAM_KEY, teamAbbrev);
}

export function clearFavoriteTeam() {
  localStorage.removeItem(FAVORITE_TEAM_KEY);
}