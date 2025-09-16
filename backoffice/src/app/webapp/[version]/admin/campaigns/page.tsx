"use client"
import Campaigns from "@/components/admin/Campaigns"
import AdminLayout from "@/components/scaffold/AdminLayout"
import { usePagePath } from "@/lib/utils"

const Page = () => {
    const { version } = usePagePath()
    return <AdminLayout version={version}>
        <Campaigns/>
    </AdminLayout>
}

export default Page