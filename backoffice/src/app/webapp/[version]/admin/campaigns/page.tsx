"use client"
import Campaigns from "@/components/admin/Campaigns"
import AdminLayout from "@/components/scaffold/AdminLayout"
import { usePagePath } from "@/lib/usePagePath"

const Page = () => {
    const { version } = usePagePath()
    return <AdminLayout version={version}>
        <Campaigns/>
    </AdminLayout>
}

export default Page