import { Api } from 'nocodb-sdk'

const api = new Api({
  baseURL: process.env.NOCO_API_URL,
  headers: {
    'xc-token': process.env.NOCO_API_KEY
  },timeout: 15000
})

export async function GET(request: Request) {
  const res = await api.dbTableRow.list('v1', 'sb', 'comptes')
  return new Response(JSON.stringify(res.list), {
    status: 200
  })
}