import { usePathname, useSearchParams } from "next/navigation"

export const usePagePath = () => {
    const path = usePathname()
    const segments = path!.split('/')
    const params = useSearchParams()
    return { version: segments[2], param: segments[4], rest: segments.slice(3), query: params }
}