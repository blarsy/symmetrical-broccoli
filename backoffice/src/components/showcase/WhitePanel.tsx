import { Stack, Theme, Typography } from "@mui/material"
import { useMediaQuery } from "@mui/system"
import { ReactNode } from "react"
import { SectionTitle } from "./uiLib"

interface WhitePanelProps {
    theme: Theme
    children: ReactNode
    title: string
}

export default ({ theme, children, title }: WhitePanelProps) => {
    const smallScreen = useMediaQuery(theme.breakpoints.down('md'))
    return <Stack paddingTop="2rem">
        <SectionTitle title={title} />
        <Stack alignContent="center" padding={smallScreen ? '2rem' : '5rem'} sx={{
            backgroundColor: '#fcf5ef',
            [theme.breakpoints.up('md')]: {
                backgroundColor: 'transparent',
                backgroundImage: `url('/FOND.svg')`,
                backgroundRepeat: 'no-repeat',
                backgroundOrigin: "border-box",
                backgroundPosition: 'top',
                backgroundSize: '110% 100%'
            }
        }}>
            {children}
        </Stack>
    </Stack>
}