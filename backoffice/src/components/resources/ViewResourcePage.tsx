"use client"
import ViewResource from "@/components/resources/ViewResource"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/usePagePath"

const ViewResourcePage = () => {
    const { param } = usePagePath()
    
    return <ConnectedLayout allowAnonymous>
        <ViewResource resourceId={param} />
    </ConnectedLayout>
}

export default ViewResourcePage