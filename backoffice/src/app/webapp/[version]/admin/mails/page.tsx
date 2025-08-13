"use client"
import Mails from "@/components/admin/Mails"
import AdminLayout from "@/components/scaffold/AdminLayout"
import { usePagePath } from "@/lib/utils"

const Page = () => {
    const { version } = usePagePath()
    return <AdminLayout version={version}>
        <Mails/>
    </AdminLayout>
}

export default Page