"use client"
import ClientLayout from "@/components/ClientLayout"
import ClientWrapper from "@/components/ClientWrapper"
import Register from "@/components/user/Register"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  return (
    <ClientWrapper>
      <ClientLayout>
        <Register onSuccess={() => {
          router.push('/webapp/')
        }}/>
      </ClientLayout>
    </ClientWrapper>
  )
}
