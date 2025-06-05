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

export const maxLength = (text: string | undefined, maxLength: number) => {
    if(!text) return ''

    const terminationSequence = '...'
    if(text.length > (maxLength - terminationSequence.length)) {
        return `${text.substring(0, maxLength - terminationSequence.length)}${terminationSequence}`
    }
    return text
}

export enum AuthProviders {
    google = 0,
    apple = 1
}