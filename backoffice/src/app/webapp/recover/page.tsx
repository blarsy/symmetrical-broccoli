"use client"
import ClientLayout from "@/components/ClientLayout"
import RequestRecovery from "@/components/user/RequestRecovery"

export default function Home() {
  return <ClientLayout>
    <RequestRecovery />
  </ClientLayout>
}
