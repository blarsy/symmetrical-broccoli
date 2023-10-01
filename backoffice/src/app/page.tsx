"use client"
import { Container, Typography } from "@mui/material"
import Qr from "react-qr-code"

const baseUrl = process.env.TOPELA_API_URL

const Page = () => <Container>
    <Typography variant="h1">Titre</Typography>
    <Qr value={`${baseUrl}/api/link/1`} />
</Container>

export default Page