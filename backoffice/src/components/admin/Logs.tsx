import { Stack, Tab, Tabs } from "@mui/material"
import { useState } from "react"
import ServerLogs from "./ServerLogs"
import ClientLogs from "./ClientLogs"

const Logs = () => {
    const [currentTab, setCurrentTab] = useState(0)

    return <Stack gap="1rem">
        <Tabs value={currentTab} onChange={(e, newTabIdx) => setCurrentTab(newTabIdx)}>
            <Tab label="Server"/>
            <Tab label="Client"/>
        </Tabs>
        { currentTab === 0 && <ServerLogs /> }
        { currentTab === 1 && <ClientLogs/> }
    </Stack>
}

export default Logs