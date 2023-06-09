"use client"
import Register from "@/components/user/Register"
import { Box, Container, Typography } from "@mui/material"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  return (
    <Container sx={{ height: '100vh' }}>
      <Box display="flex" flexDirection="column" alignItems="center">
        <Typography variant="h1">Inscription</Typography>
        <Register onSuccess={() => {
          router.push('/')
        }}/>
      </Box>
    </Container>
  )
}
