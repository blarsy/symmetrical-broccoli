"use client"
import Search from "@/components/search/Search"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"

const Page = () => {
    return <ConnectedLayout allowAnonymous>
        <Search/>
    </ConnectedLayout>
}

export default Page