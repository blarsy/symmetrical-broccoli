"use client"
import ClientLayout from "@/components/ClientLayout"
import Recover from "@/components/user/Recover"

export default async function Recovery( p : { params: Promise<{ id: string, version: string }> }) {
    const params = await p.params
    return <ClientLayout version={params.version}>
        <Recover recoveryId={params.id} />
    </ClientLayout>
}
