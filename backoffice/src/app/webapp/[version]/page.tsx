"use client"
import Search from "@/components/search/Search"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/usePagePath"

const Page = () => {
    const { version } = usePagePath()
    return <ConnectedLayout version={version} allowAnonymous>
        <Search version={version}/>
    </ConnectedLayout>
}

export default Page