import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Nunito:wght@700;800;900&family=Raleway:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* AOS (Animate On Scroll) CSS */}
        <link rel="stylesheet" href="https://unpkg.com/aos@next/dist/aos.css" />
      </Head>
      <body className="bg-[#f1e4d0] text-[#1f2a37] antialiased" suppressHydrationWarning>
        <Main />
        <NextScript />
        {/* AOS (Animate On Scroll) JS */}
        <script src="https://unpkg.com/aos@next/dist/aos.js"></script>
      </body>
    </Html>
  );
}
