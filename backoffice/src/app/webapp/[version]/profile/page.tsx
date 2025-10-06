"use client"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import Profile from "@/components/user/Profile"
import { usePagePath } from "@/lib/usePagePath"

const Page = () => {
    const { version } = usePagePath()
    return <ConnectedLayout version={version}>
        <Profile/>
    </ConnectedLayout>
}

export default Page