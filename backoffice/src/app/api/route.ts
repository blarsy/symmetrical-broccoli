import { Api } from 'nocodb-sdk'

const api = new Api({
  baseURL: process.env.NOCO_API_URL,
  headers: {
    'xc-token': process.env.NOCO_API_KEY
  },timeout: 15000
})

export async function GET(request: Request) {
  try {
    const res = await api.dbTableRow.list('v1', 'sb', 'comptes')
    return new Response(JSON.stringify(res.list), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': JSON.parse(process.env.NEXT_PUBLIC_APP_URLS)
      }
    })
  } catch(e: any) {
    return new Response(JSON.stringify(e), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': JSON.parse(process.env.NEXT_PUBLIC_APP_URLS)
      }
    })
  }
}