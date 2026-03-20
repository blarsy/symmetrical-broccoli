"use client"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import Preferences from "@/components/user/Preferences"

const Page = () => {
    return <ConnectedLayout>
        <Preferences />
    </ConnectedLayout>
}

export default Page