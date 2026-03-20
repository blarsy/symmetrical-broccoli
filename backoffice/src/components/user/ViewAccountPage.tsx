"use client"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import ViewAccount from "@/components/user/ViewAccount"
import { usePagePath } from "@/lib/usePagePath"

const ViewAccountPage = () => {
    const { param } = usePagePath()
    return <ConnectedLayout allowAnonymous>
        <ViewAccount accountId={param} />
    </ConnectedLayout>
}

export default ViewAccountPage