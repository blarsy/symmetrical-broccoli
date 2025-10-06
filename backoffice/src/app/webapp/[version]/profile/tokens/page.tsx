"use client"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import Tokens from "@/components/user/Tokens"
import { usePagePath } from "@/lib/usePagePath"

const Page = () => {
    const { version } = usePagePath()
    return <ConnectedLayout version={version}>
        <Tokens version={version}/>
    </ConnectedLayout>
}

export default Page