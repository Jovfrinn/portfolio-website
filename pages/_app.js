import "../styles/globals.css";
import "../components/Hero/hero.css";
import { useRouter } from "next/router";
import { LanguageProvider } from "../context/LanguageContext";
import { WeatherProvider } from "../context/WeatherContext";
import { AdminDraftProvider } from "../components/admin/AdminDraftContext";

const App = ({ Component, pageProps }) => {
  const router = useRouter();
  const isAdminApp = router.pathname.startsWith("/admin") && router.pathname !== "/admin/login";

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
