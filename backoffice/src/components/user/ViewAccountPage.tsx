"use client"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import ViewAccount from "@/components/user/ViewAccount"
import { usePagePath } from "@/lib/usePagePath"

const ViewAccountPage = () => {
    const { version, param } = usePagePath()
    return <ConnectedLayout version={version} allowAnonymous>
        <ViewAccount accountId={param} version={version} />
    </ConnectedLayout>
}

export default ViewAccountPage