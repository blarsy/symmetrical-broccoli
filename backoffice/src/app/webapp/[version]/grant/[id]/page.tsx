"use client"
import GrantHit from "@/components/grant/GrantHit"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/usePagePath"


const Page = () => {
    const { version, param } = usePagePath()
    return <ConnectedLayout version={version}>
        <GrantHit grantId={param}/>
    </ConnectedLayout>
}

export default Page