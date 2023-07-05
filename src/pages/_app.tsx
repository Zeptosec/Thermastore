import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createContext, useState } from 'react'
import Layout from '@/components/Layout'
import AudioContext from '@/context/AudioContext'
import FileManagerProvider from '@/context/FileManagerContext'
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient({ supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL }));
  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <Head>
        <meta property='og:title' content='Thermastore' />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://thermastore.netlify.app' />
        <meta key="desc" property='og:description' content='A free, simple and easy to use cloud storage for your files. Upload, backup and share your files with others now.' />
      </Head>
      <FileManagerProvider>
        <AudioContext>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </AudioContext>
      </FileManagerProvider>
    </SessionContextProvider>
  )
}
