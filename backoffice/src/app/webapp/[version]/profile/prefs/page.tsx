"use client"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import Preferences from "@/components/user/Preferences"
import { usePagePath } from "@/lib/utils"

const Page = () => {
    const { version } = usePagePath()
    return <ConnectedLayout version={version}>
        <Preferences />
    </ConnectedLayout>
}

export default Page