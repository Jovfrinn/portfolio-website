import { useEffect, useRef, useState } from "react";
import { useWeather } from "../../context/WeatherContext";

const A = "/hero";
const sprite = (part, key) => `${A}/${part}-${key}.webp`;

const WEATHER_WAIT_MS = 800;
const PRELOAD_HARD_CAP_MS = 6000;
const STAGE_GAP_MS = 300;

function getSceneByHourLocal(hour) {
  if (hour >= 5 && hour < 10) return "pagi";
  if (hour >= 10 && hour < 15) return "siang";
  if (hour >= 15 && hour < 18) return "sore";
  return "malam";
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new window.Image();
    const done = () => resolve();
    img.onload = () => {
      if (img.decode) {
        img.decode().then(done).catch(done);
      } else {
        done();
      }
    };
    // Don't let one broken asset block the whole reveal.
    img.onerror = done;
    img.src = src;
  });
}

function preloadSceneAssets(key) {
  const urls = [
    `${A}/${key}.svg`,
    `${A}/jendela.svg`,
    sprite("body", key),
    sprite("head", key),
    sprite("hand", key),
  ];
  return Promise.all(urls.map(preloadImage));
}

function withHardCap(promise) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(resolve, PRELOAD_HARD_CAP_MS)),
  ]);
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler);
    };
  }, []);
  return reduced;
}

/**
 * Resolves which hero scene to show, preloads its assets before revealing
 * anything, and drives the staged layer-by-layer reveal once per page visit.
 *
 * Scene resolution: hour-of-day decides the default scene immediately;
 * the weather fetch already running in WeatherContext gets up to 800ms to
 * confirm rain before we commit to an initial scene. If rain is confirmed
 * later (after something is already showing), we preload the rain assets
 * in the background and crossfade via the existing per-scene CSS animation
 * (keyed remount) instead of replaying the staged reveal.
 */
export function useHeroReveal() {
  const { weather, isRaining } = useWeather();
  const reducedMotion = usePrefersReducedMotion();

  const [ready, setReady] = useState(false);
  const [scene, setScene] = useState(null);
  const [revealStage, setRevealStage] = useState(0);

  const settledRef = useRef(false);
  const cancelledRef = useRef(false);
  const hourSceneRef = useRef(null);
  if (hourSceneRef.current === null && typeof window !== "undefined") {
    hourSceneRef.current = getSceneByHourLocal(new Date().getHours());
  }

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const settleWith = (key) => {
    if (settledRef.current) return;
    settledRef.current = true;
    withHardCap(preloadSceneAssets(key).catch(() => {})).then(() => {
      if (cancelledRef.current) return;
      setScene(key);
      setReady(true);
    });
  };

  // Give the parallel weather fetch (already running in WeatherContext) up
  // to 800ms; if it hasn't resolved by then, commit to the hour-based scene.
  useEffect(() => {
    const t = setTimeout(() => settleWith(hourSceneRef.current || "siang"), WEATHER_WAIT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (weather === null) return; // weather not resolved yet

    if (!settledRef.current) {
      // Weather resolved inside the race window -- use it directly.
      settleWith(isRaining ? "hujan" : hourSceneRef.current || "siang");
      return;
    }

    // Already showing something; rain confirmed afterwards -> crossfade later.
    if (isRaining && scene && scene !== "hujan") {
      preloadSceneAssets("hujan")
        .catch(() => {})
        .then(() => {
          if (!cancelledRef.current) setScene("hujan");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather, isRaining, scene]);

  // Staged layer-by-layer reveal, once per page visit only.
  const hasStagedRef = useRef(false);
  useEffect(() => {
    if (!ready || hasStagedRef.current) return;
    hasStagedRef.current = true;

    if (reducedMotion) {
      setRevealStage(5);
      return;
    }

    setRevealStage(1);
    const timers = [];
    for (let i = 0; i < 4; i++) {
      timers.push(setTimeout(() => setRevealStage(i + 2), STAGE_GAP_MS * (i + 1)));
    }
    return () => timers.forEach(clearTimeout);
  }, [ready, reducedMotion]);

  return { ready, scene, revealStage, reducedMotion };
}
