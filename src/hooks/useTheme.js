import { useEffect, useState } from "react";

const useTheme = () => {
  const getInitialTheme = () => {
    // 1. On vérifie d'abord si l'utilisateur a déjà fait un choix
    const saved = localStorage.getItem("theme");
    if (saved) return saved;

    // 2. Sinon on prend la préférence système
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement; // la balise <html>

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // On sauvegarde le choix de l'utilisateur
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, toggleTheme };
};

export default useTheme;
