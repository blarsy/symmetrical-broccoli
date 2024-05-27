"use client"
import ClientLayout from "@/components/ClientLayout"
import Recover from "@/components/user/Recover"

export default function Recovery({ params }: { params: { id: string, version: string } }) {
    return <ClientLayout version={params.version}>
        <Recover recoveryId={params.id} />
    </ClientLayout>
}
