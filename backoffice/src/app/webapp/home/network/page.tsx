"use client"
import ClientLayout from "@/components/ClientLayout"
import LoggedInLayout from "@/components/LoggedInLayout"
import Network from "@/components/user/Network"

const NetworkPage = () => <ClientLayout>
    <LoggedInLayout title="Mon réseau">
        <Network />
    </LoggedInLayout>
</ClientLayout>

export default NetworkPage