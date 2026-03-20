"use client"
import Chat from "@/components/chat/Chat"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import { usePagePath } from "@/lib/usePagePath"

const Page = () => {
    const { rest, query } = usePagePath()

    return <ConnectedLayout>
      <Chat
        showConversationsRequested={() => {
          const urlPieces = window.location.href.split('/')
          urlPieces.pop()
          urlPieces.pop()
          window.history.replaceState({...window.history.state}, '', urlPieces.join('/'))
        }} sx={{ flex: 1, overflow: 'clip', minHeight: 0 }} resourceId={rest[0]}
        withAccountId={!!query?.get('with') ? query?.get('with')! : undefined }
        onConversationSelected={(target) => {
          const urlPieces = window.location.href.split('/')
          
          if(urlPieces[urlPieces.length - 3] === 'chat' && urlPieces[urlPieces.length - 2] === 'new') {
            urlPieces.pop()
            urlPieces.pop()
          } else if(urlPieces[urlPieces.length - 2] === 'chat') {
            urlPieces.pop()       
          }

          window.history.replaceState({...window.history.state}, '', `${urlPieces.join('/')}/${target}`)
        }} onConversationCreated={conversationId => { 
            const urlPieces = window.location.href.split('/')
            urlPieces.pop()
            urlPieces.pop()
            window.history.replaceState({...window.history.state}, '', `${urlPieces.join('/')}/${conversationId}`)
        }}/>
    </ConnectedLayout>
}

export default Page