"use client"
import Resources from "@/components/resources/Resources"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/usePagePath"

const Page = () => {
    const { version } = usePagePath()
    return <ConnectedLayout version={version}>
        <Resources/>
    </ConnectedLayout>
}

export default Page