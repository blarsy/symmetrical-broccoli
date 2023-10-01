"use client"
import { primaryColor } from "@/utils"
import { Box, Stack, Typography } from "@mui/material"
import Image from "next/image"
import Qr from "react-qr-code"
import theme from '@/theme'
import { ThemeProvider } from "@emotion/react"

const baseUrl = process.env.TOPELA_API_URL

const Page = () => <ThemeProvider theme={theme}>
    <Stack>
        <Stack flexDirection="row">
            <Stack display="flex" flex="1 1 60%" alignItems="center">
                <Typography variant="h1" textAlign="center">L&#39;app des assso&#39; qui fait tourner les ressources</Typography>
                <Qr value={`${baseUrl}/api/link/1`} />
            </Stack>
            <Box display="flex" flex="1 1 40%" padding="5rem 0" justifyContent="center" sx={{ backgroundColor: primaryColor }}>
                <Image src="/logo.jpeg" alt="logo" width="240" height="200"/>
            </Box>
        </Stack>
        <Stack padding="5rem" alignItems="center">
            <Typography variant="h2">Bient&ocirc;t ...</Typography>
            <Image src="/google-play-apple-store-logo.jpg" alt="stores" height="200" width="250"/>
        </Stack>
    </Stack>
</ThemeProvider>

export default Page