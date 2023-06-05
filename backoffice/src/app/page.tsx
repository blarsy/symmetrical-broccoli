"use client"
import { Box, Container } from "@mui/material"
import axios from "axios"
import { useState, useEffect } from "react"
export default function Home() {
  const [accounts, setAccounts] = useState([] as any[])
  useEffect(() => {
    const load = async () => {
      const res = await axios.get('/api')
      setAccounts(res.data)
    }
    load()
  }, [])
  return (
    <Container sx={{ height: '100vh'}}>
      Main
      {accounts.map(account => <Box>
        {account.Id}
      </Box>)}
    </Container>
  )
}
