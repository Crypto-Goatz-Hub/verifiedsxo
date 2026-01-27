import Head from 'next/head';
import VerifiedSXO from '../App';

export default function Home() {
  return (
    <>
      <Head>
        <title>VerifiedSXO - The Verified Intelligence Engine</title>
        <meta name="description" content="25 years of marketing intelligence. Verified sources. One question away." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a12" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </Head>
      <VerifiedSXO />
    </>
  );
}
