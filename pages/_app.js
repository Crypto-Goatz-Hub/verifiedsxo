import { SessionProvider } from 'next-auth/react';
import Script from 'next/script';
import '../styles/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Script
        id="ahrefs-analytics"
        strategy="afterInteractive"
        src="https://analytics.ahrefs.com/analytics.js"
        data-key="Sx0nyexetnmv2Nj5LczosA"
      />
      <Component {...pageProps} />
    </SessionProvider>
  );
}
