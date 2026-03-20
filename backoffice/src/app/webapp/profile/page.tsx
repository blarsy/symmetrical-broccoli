"use client"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import Profile from "@/components/user/Profile"

const Page = () => {
    return <ConnectedLayout>
        <Profile/>
    </ConnectedLayout>
}

export default Page