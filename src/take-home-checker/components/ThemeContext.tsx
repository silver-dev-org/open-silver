"use client";

import React, { PropsWithChildren, useEffect, useState } from "react";

export const ThemeContext = React.createContext({
  isDark: false,
  setIsDark: (_p: boolean) => {},
});

export const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = window.localStorage.getItem("theme");
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      setIsDark(storedTheme ? storedTheme === "dark" : prefersDark);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
};
