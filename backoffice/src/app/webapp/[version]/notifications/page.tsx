"use client"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import Notifications from "@/components/user/Notifications"
import { usePagePath } from "@/lib/utils"

const Page = () => {
    const { version } = usePagePath()
    return <ConnectedLayout version={version}>
        <Notifications version={version}/>
    </ConnectedLayout>
}

export default Page