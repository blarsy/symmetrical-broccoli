"use client"
import Grants from "@/components/admin/Grants"
import AdminLayout from "@/components/scaffold/AdminLayout"
import { usePagePath } from "@/lib/usePagePath"

const Page = () => {
    const { version } = usePagePath()
    return <AdminLayout version={version}>
        <Grants/>
    </AdminLayout>
}

export default Page