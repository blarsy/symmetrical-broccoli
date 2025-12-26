import dayjs from 'dayjs'
import './globals.css'
import { Inter } from 'next/font/google'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
import { headers } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

dayjs.extend(relativeTime)

export const metadata = {
  title: 'Tope-la',
  description: 'Don, échanges, troc',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const nonce = (await headers()).get('x-nonce')
  return (
    <html lang="en">
      <head>
        <script nonce={nonce!}
          id="google-tag-manager"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;var n=d.querySelector('[nonce]');n&&j.setAttribute('nonce',n.nonce||n.getAttribute('nonce'));f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-MR78JZ3G');</script>`
          }} />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-JV8DL8LGWS"></script>
        <script nonce={nonce!} dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
  
            gtag('config', 'G-JV8DL8LGWS');`
          }} />
        <script src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" defer></script>
      </head>
      <body className={inter.className}>
        <noscript dangerouslySetInnerHTML={{
          __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MR78JZ3G" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
        }} />
        {children}
      </body>
    </html>
  )
}
