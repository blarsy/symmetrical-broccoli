"use client"
import Logs from "@/components/admin/Logs"
import AdminLayout from "@/components/scaffold/AdminLayout"
import { usePagePath } from "@/lib/usePagePath"

const Page = () => {
    const { version } = usePagePath()
    return <AdminLayout version={version}>
        <Logs/>
    </AdminLayout>
}

export default Page