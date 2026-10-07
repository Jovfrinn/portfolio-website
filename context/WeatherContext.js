import React, { createContext, useContext, useState, useEffect } from "react";

const WeatherContext = createContext({
  scene: "siang",
  jakartaTime: "--:--",
  weather: null,
  isRaining: false,
});

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-6.2088&longitude=106.8456&current_weather=true";

// WMO code hujan: gerimis 51-57, hujan 61-67, shower 80-82, badai petir 95-99
const isRainCode = (c) =>
  typeof c === "number" &&
  ((c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95);

const getSceneByHour = (hour) => {
  if (hour >= 5 && hour < 10) return "pagi";
  if (hour >= 10 && hour < 15) return "siang";
  if (hour >= 15 && hour < 18) return "sore";
  return "malam";
};

export function WeatherProvider({ children }) {
  const [scene, setScene] = useState("siang");
  const [jakartaTime, setJakartaTime] = useState("");
  const [weather, setWeather] = useState(null);
  const [isRaining, setIsRaining] = useState(false);

  useEffect(() => {
    // 1. Set scene based on visitor's current hour
    const localHour = new Date().getHours();
    const defaultScene = getSceneByHour(localHour);
    setScene(defaultScene);

    // 2. Format Jakarta time
    const updateJakartaTime = () => {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        setJakartaTime(formatter.format(new Date()));
      } catch (e) {
        const d = new Date();
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        setJakartaTime(`${hh}:${mm}`);
      }
    };

    updateJakartaTime();
    const interval = setInterval(updateJakartaTime, 60000);

    // 3. Fetch weather from Open-Meteo once
    let isCancelled = false;
    fetch(WEATHER_URL)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        const currentWeather = data?.current_weather;
        if (currentWeather) {
          setWeather(currentWeather);
          const raining = isRainCode(currentWeather.weathercode);
          setIsRaining(raining);
          if (raining) {
            setScene("hujan");
          }
        }
      })
      .catch(() => {
        // Fallback gracefully to hour-based scene
      });

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <WeatherContext.Provider value={{ scene, jakartaTime, weather, isRaining }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  return useContext(WeatherContext);
}
