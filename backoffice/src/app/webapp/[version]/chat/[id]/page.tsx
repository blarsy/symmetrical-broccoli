"use client"
import Chat from "@/components/chat/Chat"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/usePagePath"

const Page = () => {
    const { version, param } = usePagePath()

    return <ConnectedLayout version={version}>
      <Chat sx={{ flex: 1, overflow: 'clip', minHeight: 0 }} 
        showConversationsRequested={() => {
          const urlPieces = window.location.href.split('/')
          urlPieces.pop()
          window.history.replaceState({...window.history.state}, '', urlPieces.join('/'))
        }}
        conversationId={param}
        onConversationSelected={id => {
          window.history.replaceState({...window.history.state}, '', `${id}`)
        }}/>
    </ConnectedLayout>
}

export default Page