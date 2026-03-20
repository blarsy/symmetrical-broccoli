"use client"
import ClientLayout from "@/components/scaffold/ClientLayout"
import Recover from "@/components/user/Recover"
import { usePagePath } from "@/lib/usePagePath"

export default function Recovery() {
    const { param } = usePagePath()

    return <ClientLayout>
        <Recover recoveryId={param} />
    </ClientLayout>
}
