import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createContext, useState } from 'react'
import Layout from '@/components/Layout'

export default function App({ Component, pageProps }: AppProps) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient({ supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL }));
  const [isUploading, setIsUploading] = useState(false);
  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
        <Layout isUploading={isUploading}>
          <Component {...pageProps} setIsUploading={setIsUploading} isUploading={isUploading} />
        </Layout>
    </SessionContextProvider>
  )
}
