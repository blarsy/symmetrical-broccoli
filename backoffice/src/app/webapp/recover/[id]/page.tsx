"use client"
import ClientLayout from "@/components/ClientLayout"
import Recover from "@/components/user/Recover"

export default function Recovery({ params }: { params: { id: string, fromApp: boolean } }) {
    return <ClientLayout>
        <Recover recoveryId={params.id} />
    </ClientLayout>
}
