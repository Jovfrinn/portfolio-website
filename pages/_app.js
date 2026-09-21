import "../styles/globals.css";
import { LanguageProvider } from "../context/LanguageContext";

const App = ({ Component, pageProps }) => {
  return (
    <LanguageProvider>
      <Component {...pageProps} />
    </LanguageProvider>
  );
};

export default App;
