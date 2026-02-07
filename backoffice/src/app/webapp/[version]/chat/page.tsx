"use client"
import Chat from "@/components/chat/Chat"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/usePagePath"

const Page = () => {
    const { version } = usePagePath()

    return <ConnectedLayout version={version}>
      <Chat sx={{ flex: 1, overflow: 'clip', minHeight: 0  }} 
        showConversationsRequested={() => {}}
        onConversationSelected={(target, current) => {
          //TODO: If target != current, remove the new conversation

          if(current) {
            window.history.replaceState({...window.history.state}, '', `${target}`)
          } else {
            window.history.replaceState({...window.history.state}, '', `chat/${target}`)
          }
        }} />
    </ConnectedLayout>
}

export default Page