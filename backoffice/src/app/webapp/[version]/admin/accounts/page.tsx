"use client"
import Accounts from "@/components/admin/Accounts"
import AdminLayout from "@/components/scaffold/AdminLayout"
import { usePagePath } from "@/lib/utils"

const Page = () => {
    const { version } = usePagePath()
    return <AdminLayout version={version}>
        <Accounts/>
    </AdminLayout>
}

export default Page