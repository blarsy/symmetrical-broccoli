"use client"
import ClientLayout from "@/components/ClientLayout"
import Login from "@/components/user/Login"
import { Box, Link } from "@mui/material"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if(localStorage.getItem('token')){
      router.push('/home')
    }
  }, [])

  return (
    <ClientLayout title="Connexion">
      <Box display="flex" flexDirection="column" alignItems="center">
        <Login onSuccess={() => {
          router.push('/home')
        }}/>
        <Link href="/register">Pas encore inscrit ?</Link>
      </Box>
    </ClientLayout>
  )
}
