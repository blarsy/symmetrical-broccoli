import { PropsWithChildren } from "react"
import { Container } from "@mui/material"

import ClientWrapper from "./ClientWrapper"
import TopBar from "./TopBar"
import { PropsWithVersion } from "@/lib/utils"

export const ConnectedLayout = (p: PropsWithVersion) => {
    return <ClientWrapper version={ p.version }>
        <Container maxWidth="xl">
            <TopBar version={ p.version }/>
            { p.children }
        </Container>
    </ClientWrapper>
}

export default ConnectedLayout