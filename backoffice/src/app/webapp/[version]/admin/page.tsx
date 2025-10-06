"use client"
import AdminLayout from "@/components/scaffold/AdminLayout"
import { usePagePath } from "@/lib/usePagePath"
import { Typography } from "@mui/material"

const Page = () => {
    const { version } = usePagePath()
    return <AdminLayout version={version}>
        <Typography variant="h4">Welcome to Tope-là admin</Typography>
    </AdminLayout>
}

export default Page