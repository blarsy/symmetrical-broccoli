"use client"
import Search from "@/components/search/Search"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/utils"

const Page = () => {
    const { version } = usePagePath()
    return <ConnectedLayout version={version}>
        <Search/>
    </ConnectedLayout>
}

export default Page