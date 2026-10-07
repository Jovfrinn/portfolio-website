import "../styles/globals.css";
import "../components/Hero/hero.css";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { LanguageProvider } from "../context/LanguageContext";
import { WeatherProvider } from "../context/WeatherContext";
import { AdminDraftProvider } from "../components/admin/AdminDraftContext";

const App = ({ Component, pageProps }) => {
  const router = useRouter();
  const isAdminApp = router.pathname.startsWith("/admin") && router.pathname !== "/admin/login";

  useEffect(() => {
    const initAOS = () => {
      if (typeof window !== "undefined" && window.AOS) {
        window.AOS.init({
          duration: 600,
          easing: "ease-out-cubic",
          once: false, // Animasi masuk & keluar berulang saat scroll
          mirror: true, // Animasi keluar saat di-scroll lewat
          offset: 60,
        });
      }
    };

    initAOS();
    router.events.on("routeChangeComplete", initAOS);

    return () => {
      router.events.off("routeChangeComplete", initAOS);
    };
  }, [router.events]);

  if (isAdminApp) {
    return (
      <AdminDraftProvider>
        <Component {...pageProps} />
      </AdminDraftProvider>
    );
  }

  return (
    <LanguageProvider>
      <WeatherProvider>
        <Component {...pageProps} />
      </WeatherProvider>
    </LanguageProvider>
  );
};

export default App;
