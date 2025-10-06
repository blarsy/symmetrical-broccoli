"use client"
import ClientLayout from "@/components/scaffold/ClientLayout"
import Activation from "@/components/user/Activation"
import { usePagePath } from "@/lib/usePagePath"

export default function Activate() {
    const { version, param } = usePagePath()

    return <ClientLayout version={version}>
        <Activation activationId={param} />
    </ClientLayout>
}
