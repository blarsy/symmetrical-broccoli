"use client"
import BidsList from "@/components/bids/BidsList"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"

const Page = () => {
    return <ConnectedLayout allowAnonymous>
        <BidsList/>
    </ConnectedLayout>
}

export default Page