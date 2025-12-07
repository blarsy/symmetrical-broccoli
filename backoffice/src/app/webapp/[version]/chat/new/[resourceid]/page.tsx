"use client"
import Chat from "@/components/chat/Chat"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/usePagePath"
import { useRouter } from "next/navigation"

const Page = () => {
    const { version, rest } = usePagePath()
    const router = useRouter()

    return <ConnectedLayout version={version}>
      <Chat
        showConversationsRequested={() => {
          const urlPieces = window.location.href.split('/')
          urlPieces.pop()
          urlPieces.pop()
          window.history.replaceState({...window.history.state}, '', urlPieces.join('/'))
        }} sx={{ flex: 1, overflow: 'clip', minHeight: 0 }} resourceId={Number(rest[2])}
        onConversationSelected={(target, current) => {
          //window.history.replaceState({...window.history.state}, '', `../${target}`)
          router.push(`/webapp/${version}/chat/${target}`)
        }}/>
    </ConnectedLayout>
}

export default Page