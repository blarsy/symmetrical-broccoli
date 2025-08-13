"use client"
import BidsList from "@/components/bids/BidsList"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/utils"

const Page = () => {
    const { version } = usePagePath()
    return <ConnectedLayout version={version} allowAnonymous>
        <BidsList/>
    </ConnectedLayout>
}

export default Page