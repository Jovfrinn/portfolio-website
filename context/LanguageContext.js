import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("portfolio_lang");
    if (savedLang === "en" || savedLang === "id") {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const changeLanguage = (newLang) => {
    if (newLang === "en" || newLang === "id") {
      setLang(newLang);
      localStorage.setItem("portfolio_lang", newLang);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
