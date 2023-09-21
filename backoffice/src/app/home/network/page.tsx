"use client"
import ClientWrapper from "@/components/ClientWrapper"
import LoggedInLayout from "@/components/LoggedInLayout"
import Network from "@/components/user/Network"

const NetworkPage = () => <ClientWrapper>
        <LoggedInLayout title="Mon réseau">
            <Network />
        </LoggedInLayout>
    </ClientWrapper>

export default NetworkPage