"use client"
import Chat from "@/components/chat/Chat"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/utils"

const Page = () => {
    const { version, param } = usePagePath()

    return <ConnectedLayout version={version}>
      <Chat sx={{ flex: 1, overflow: 'clip', minHeight: 0 }} conversationId={Number(param)}
        onConversationSelected={id => {
          window.history.replaceState({...window.history.state}, '', `${id}`)
        }}/>
    </ConnectedLayout>
}

export default Page