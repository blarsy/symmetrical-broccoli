"use client"
import Login from "@/components/user/Login"
import { Box, Container, Link, Typography } from "@mui/material"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  return (
    <Container sx={{ height: '100vh' }}>
      <Box display="flex" flexDirection="column" alignItems="center">
        <Typography variant="h1">Connection</Typography>
        <Login onSuccess={() => {
          router.push('/home')
        }}/>
        <Link href="/register">Pas encore inscrit ?</Link>
      </Box>
    </Container>
  )
}
