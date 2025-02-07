"use client"
import ClientLayout from "@/components/ClientLayout"
import Activation from "@/components/user/Activation"

export default async function Activate(p: {params: Promise<{
    id: string, version: string
}>}) {
    const params = await p.params
    return <ClientLayout version={params.version}>
        <Activation activationId={params.id} />
    </ClientLayout>
}
