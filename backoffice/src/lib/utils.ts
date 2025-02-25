import { usePathname } from "next/navigation"
import { PropsWithChildren } from "react"

export const usePagePath = () => {
    const path = usePathname()
    const segments = path!.split('/')
    return { version: segments[2], param: segments[4] }
}

export interface PropsWithVersion extends PropsWithChildren {
    version: string
}