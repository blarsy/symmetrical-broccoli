"use client"
import ClientLayout from "@/components/ClientLayout"
import ClientWrapper from "@/components/ClientWrapper"
import RequestRecovery from "@/components/user/RequestRecovery"

export default function Home() {
  return (
    <ClientWrapper>
      <ClientLayout>
        <RequestRecovery />
      </ClientLayout>
    </ClientWrapper>
  )
}
