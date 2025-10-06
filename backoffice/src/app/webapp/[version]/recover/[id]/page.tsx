"use client"
import ClientLayout from "@/components/scaffold/ClientLayout"
import Recover from "@/components/user/Recover"
import { usePagePath } from "@/lib/usePagePath"

export default function Recovery() {
    const { version, param } = usePagePath()

    return <ClientLayout version={version}>
        <Recover recoveryId={param} />
    </ClientLayout>
}
