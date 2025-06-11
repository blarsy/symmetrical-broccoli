"use client"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import ViewAccount from "@/components/user/ViewAccount"
import { usePagePath } from "@/lib/utils"

const Page = () => {
    const { version, param } = usePagePath()
    return <ConnectedLayout version={version} allowAnonymous>
        <ViewAccount accountId={Number(param)} version={version} />
    </ConnectedLayout>
}

export default Page