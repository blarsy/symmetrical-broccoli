"use client"
import ClientLayout from "@/components/ClientLayout"
import ClientWrapper from "@/components/ClientWrapper"
import Register from "@/components/user/Register"
import { Box, Typography } from "@mui/material"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  return (
    <ClientWrapper>
      <ClientLayout>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h1"></Typography>
          <Register onSuccess={() => {
            router.push('/')
          }}/>
        </Box>
      </ClientLayout>
    </ClientWrapper>
  )
}
