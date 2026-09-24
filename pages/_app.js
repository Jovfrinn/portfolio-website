import "../styles/globals.css";
import { useRouter } from "next/router";
import { LanguageProvider } from "../context/LanguageContext";
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
      <Component {...pageProps} />
    </LanguageProvider>
  );
};

export default App;
