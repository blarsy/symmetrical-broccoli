"use client"
import Sensor, { SensorState } from '@/components/Sensor'
import { connectDrive, getFilesInFolder, getWorkingFolder } from '@/lib/drive'
import { SensorProbeResult, makeHttpGetProbeInfo, makeProbeInfo } from '@/lib/probing'
import theme from '@/lib/theme'
import { Container, Stack, ThemeProvider, Typography } from '@mui/material'

const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL as string
const adminWebsiteUrl = process.env.NEXT_PUBLIC_ADMIN_WEBSITE_URL as string
const backupRemoteFolderName = process.env.REMOTE_BACKUPS_FOLDER_NAME as string

const probes = [
  makeHttpGetProbeInfo('API', `${websiteUrl}/api/system`),
  makeHttpGetProbeInfo('Website', `${websiteUrl}`),
  makeHttpGetProbeInfo('Admin Website', `${adminWebsiteUrl}`),
  makeHttpGetProbeInfo('Service emails', 'https://status.sendgrid.com/')
]

export default function Home() {
  return (
    <ThemeProvider theme={theme}>
      <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <Typography alignSelf="center" variant='h1'>Gestionnaire système Tope là</Typography>
        <Stack direction="row" gap="1rem" flexWrap="wrap">
          { probes.map((probe, idx) => 
            <Sensor key={idx} measureName={probe.title} probe={probe.probe} />) }
        </Stack>
      </Container>
    </ThemeProvider>
  )
}
