import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="dark" suppressHydrationWarning>
      <Head />
      <body suppressHydrationWarning>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
