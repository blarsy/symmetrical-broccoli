"use client"
import Chat from "@/components/chat/Chat"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/utils"

const Page = () => {
    const { version, rest } = usePagePath()

    return <ConnectedLayout version={version}>
      <Chat sx={{ flex: 1, overflow: 'clip', minHeight: 0 }} resourceId={Number(rest[2])}
        onConversationSelected={id => {
          window.history.replaceState({...window.history.state}, '', `${id}`)
        }}/>
    </ConnectedLayout>
}

export default Page