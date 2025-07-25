"use client"
import ViewResource from "@/components/resources/ViewResource"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/utils"

const Page = () => {
    const { version, param } = usePagePath()

    return <ConnectedLayout version={version} allowAnonymous>
        <ViewResource resourceId={Number(param)} />
    </ConnectedLayout>
}

export default Page