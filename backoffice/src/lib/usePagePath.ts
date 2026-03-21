import { usePathname, useSearchParams } from "next/navigation"

export const usePagePath = () => {
    const path = usePathname()
    const segments = path!.split('/')
    const params = useSearchParams()
    
    return { param: segments[3],rest: segments.slice(4), query: params }
}