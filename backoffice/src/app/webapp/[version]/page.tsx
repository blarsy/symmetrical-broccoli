"use client"
import Search from "@/components/search/Search"
import ClientWrapper from "@/components/scaffold/ClientWrapper"
import { usePagePath } from "@/lib/utils"
import { useEffect } from "react"

const Page = () => {
    const { version } = usePagePath()

    return <ClientWrapper version={version}>
        <Search/>
    </ClientWrapper>
}

export default Page