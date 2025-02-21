import { usePathname } from "next/navigation"

export const usePagePath = () => {
    const path = usePathname()
    const segments = path!.split('/')
    return { version: segments[2], param: segments[4] }
}