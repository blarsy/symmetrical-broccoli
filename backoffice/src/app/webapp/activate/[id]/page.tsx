"use client"
import ClientLayout from "@/components/ClientLayout"
import Activation from "@/components/user/Activation"

export default function Activate({ params }: { params: { id: string } }) {
    return <ClientLayout>
        <Activation activationId={params.id} />
    </ClientLayout>
}
