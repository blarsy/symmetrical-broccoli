"use client"
import ClientLayout from "@/components/ClientLayout"
import Recover from "@/components/user/Recover"
import { useRouter } from "next/navigation"

export default function Recovery({ params }: { params: { id: string } }) {
    const router = useRouter()
    return <ClientLayout>
        <Recover onDone={() => router.push('/webapp/')} recoveryId={params.id} />
    </ClientLayout>
}
