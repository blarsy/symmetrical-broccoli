"use client"
import ViewResource from "@/components/resources/ViewResource"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/usePagePath"

const ViewResourcePage = () => {
    const { version, param } = usePagePath()
    console.log('version, param', version, param)

    return <ConnectedLayout version={version} allowAnonymous>
        <ViewResource resourceId={Number(param)} />
    </ConnectedLayout>
}

export default ViewResourcePage