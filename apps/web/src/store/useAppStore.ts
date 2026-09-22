import { create } from "zustand";

export type Theme = "dark" | "light";

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
}

const THEME_STORAGE_KEY = "formation:theme";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function persistTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private browsing / blocked storage -- theme just won't persist.
  }
  document.documentElement.setAttribute("data-theme", theme);
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: readStoredTheme(),
  setTheme: (theme) => {
    persistTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  selectedTeamId: null,
  setSelectedTeamId: (teamId) => set({ selectedTeamId: teamId }),
}));
