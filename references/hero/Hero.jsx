"use client";

import { useEffect, useState } from "react";
import "./hero.css";

// Aset ada di public/hero/ (salin isi references/hero/assets/ ke sana)
const A = "/hero";
const jendela = `${A}/jendela.svg`;
const pagi = `${A}/pagi.svg`;
const siang = `${A}/siang.svg`;
const sore = `${A}/sore.svg`;
const malam = `${A}/malam.svg`;
const hujan = `${A}/hujan.svg`;

// body-*, head-*, hand-* per scene (pencahayaan beda tiap scene)
const sprite = (part, key) => `${A}/${part}-${key}.webp`;

// warna garis kode di layar & uap kopi per scene
const SCENES = [
  { key: "pagi", label: "Pagi", src: pagi, line: "228,187,155", steam: "255,255,255,.62" },
  { key: "siang", label: "Siang", src: siang, line: "175,199,215", steam: "255,255,255,.68" },
  { key: "sore", label: "Sore", src: sore, line: "175,117,86", steam: "255,236,205,.62" },
  { key: "malam", label: "Malam", src: malam, line: "170,179,218", steam: "205,215,255,.5" },
  { key: "hujan", label: "Hujan", src: hujan, line: "170,181,186", steam: "235,240,245,.55" },
];

const sceneByHour = (h) => {
  if (h >= 5 && h < 10) return "pagi";
  if (h >= 10 && h < 15) return "siang";
  if (h >= 15 && h < 18) return "sore";
  return "malam";
};

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-6.2088&longitude=106.8456&current_weather=true";
// WMO code hujan: gerimis 51-57, hujan 61-67, shower 80-82, badai petir 95-99
const isRain = (c) => (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95;

// koordinat di ruang gambar orang (1076 x 664)
const SCREEN_POLY = "363,273 561,268 565,296 566,315 557,326 546,348 546,357 551,358 549,367 544,377 533,378 525,397 376,405";
const CODE_BARS = [
  [451, 297, 44, 8], [394, 311, 102, 10], [429, 324, 68, 10], [398, 345, 99, 11],
  [438, 357, 59, 10], [457, 371, 40, 8],
  [523, 292, 31, 7], [523, 305, 32, 8], [527, 319, 29, 7], [529, 339, 19, 7], [538, 330, 10, 4],
];
const STEAM = [
  { x: -9, d: "0s", t: "5.6s" },
  { x: 0, d: "-1.9s", t: "6.2s" },
  { x: 9, d: "-3.7s", t: "5.2s" },
];

function Person({ scene }) {
  return (
    <div
      key={scene.key}
      className="hero-person"
      style={{ "--line": `rgb(${scene.line})`, "--steam": `rgba(${scene.steam})` }}
    >
      <img className="hp-layer" src={sprite("body", scene.key)} alt="Developer sedang coding" />
      <img className="hp-layer hp-head" src={sprite("head", scene.key)} alt="" />
      <img className="hp-layer hp-hand" src={sprite("hand", scene.key)} alt="" />

      <svg className="hp-layer hp-fx" viewBox="0 0 1076 664" aria-hidden="true">
        <defs>
          <clipPath id="hp-screen"><polygon points={SCREEN_POLY} /></clipPath>
          <filter id="hp-blur" x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>

        <g clipPath="url(#hp-screen)">
          {CODE_BARS.map(([x, y, w, h], i) => (
            <rect key={i} className="hp-line" x={x} y={y} width={w} height={h} rx={h / 2} style={{ "--i": i }} />
          ))}
        </g>

        <g transform="translate(297 428)" filter="url(#hp-blur)">
          {STEAM.map((s, i) => (
            <g key={i} transform={`translate(${s.x} 0)`}>
              <g className="hp-steam" style={{ "--d": s.d, "--t": s.t }}>
                <path className="hp-wisp" d="M0 0C-7-9 7-17 0-27S-6-44 1-54" />
              </g>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

export default function Hero({
  available = true,
  title = ["Full-Stack", "Developer."],
  subtitle = "Building CRM & CMS that actually get used.",
  projectsHref = "#projects",
  contactHref = "#contact",
}) {
  const [scene, setScene] = useState("siang");

  // scene otomatis sesuai jam pengunjung
  // jam dari Date.now(); kalau API cuaca bilang hujan, scene jadi "hujan"
  useEffect(() => {
    setScene(sceneByHour(new Date().getHours()));
    let off = false;
    fetch(WEATHER_URL)
      .then((r) => r.json())
      .then((d) => {
        if (!off && isRain(d?.current_weather?.weathercode)) setScene("hujan");
      })
      .catch(() => {});
    return () => { off = true; };
  }, []);

  const current = SCENES.find((s) => s.key === scene) ?? SCENES[1];

  return (
    <section className="hero" data-scene={current.key}>
      <div className="container-fluid hero-wrap">
        <div className="row align-items-center g-5">
          <div className="col-lg-5 hero-text">
            {available && (
              <span className="hero-badge">
                <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
                  <circle cx="10" cy="10" r="10" />
                  <path d="M5.5 10.3l3 3 6-6.3" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Available for freelance projects
              </span>
            )}

            <h1 className="hero-title">
              {title[0]}
              <br />
              {title[1]}
            </h1>
            <p className="hero-sub">{subtitle}</p>

            <div className="d-flex flex-wrap gap-3">
              <a href={projectsHref} className="hero-btn hero-btn-primary">View projects</a>
              <a href={contactHref} className="hero-btn hero-btn-outline">Contact me</a>
            </div>
          </div>

          <div className="col-lg-7 hero-right">
            <div className="hero-stage">
              <div className="hero-window">
                <img key={current.key} className="hero-scene" src={current.src} alt="" />
                <img className="hero-frame" src={jendela} alt="" />
              </div>
              <Person scene={current} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
