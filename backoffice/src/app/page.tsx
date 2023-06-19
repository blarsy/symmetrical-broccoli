"use client"
import ClientLayout from "@/components/ClientLayout"
import Login from "@/components/user/Login"
import { Box, Link, Typography } from "@mui/material"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  return (
    <ClientLayout>
      <Box display="flex" flexDirection="column" alignItems="center">
        <Typography variant="h1">Connexion</Typography>
        <Login onSuccess={() => {
          router.push('/home')
        }}/>
        <Link href="/register">Pas encore inscrit ?</Link>
      </Box>
    </ClientLayout>
  )
}
