"use client"
import ClientLayout from "@/components/ClientLayout"
import Register from "@/components/user/Register"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  return <ClientLayout title="Inscription">
      <Register onSuccess={() => {
        router.push('/webapp/')
      }}/>
    </ClientLayout>
}
