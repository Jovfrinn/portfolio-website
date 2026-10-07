import React from "react";
import { useWeather } from "../../context/WeatherContext";
import data from "../../data/portfolio.json";

export default function Footer() {
  const { jakartaTime, weather, isRaining } = useWeather();
  const currentYear = new Date().getFullYear();

  // Weather description & icon helper
  const temp =
    weather?.temperature !== undefined ? Math.round(weather.temperature) : null;

  return (
    <footer
      className="w-full border-t transition-colors duration-500"
      style={{ backgroundColor: "var(--cream)", borderTopColor: "var(--band-border)" }}
    >
      <div className="content-container py-8 flex flex-col tablet:flex-row items-center justify-between gap-4">
        {/* Left: Jakarta Time & Live Weather */}
        <div
          className="flex items-center gap-3 text-sm font-raleway font-semibold"
          style={{ color: "var(--ink)" }}
        >
          {/* Clock icon */}
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-[#2f5d56]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" strokeWidth="2" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 7v5l3 2"
              />
            </svg>
            <span>Jakarta {jakartaTime || "12:00"} WIB</span>
          </div>

          <span className="text-[#8c8275]">•</span>

          {/* Weather status */}
          <div className="flex items-center gap-1.5 text-[#2f5d56]">
            {isRaining ? (
              <span>🌧️ {temp !== null ? `${temp}°C Rain` : "Rainy"}</span>
            ) : (
              <span>☀️ {temp !== null ? `${temp}°C Jakarta` : "Sunny"}</span>
            )}
          </div>
        </div>

        {/* Right: Copyright */}
        <div className="text-sm font-raleway font-medium text-[#5d6874]">
          © {currentYear} {data.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
