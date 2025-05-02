"use client"
import Chat from "@/components/chat/Chat"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/utils"

const Page = () => {
    const { version } = usePagePath()

    return <ConnectedLayout version={version}>
      <Chat sx={{ flex: 1, overflow: 'auto', maxHeight: '100%' }} 
        onConversationSelected={id => window.history.pushState(null, '', `chat/${id}`)}/>
    </ConnectedLayout>
}

export default Page