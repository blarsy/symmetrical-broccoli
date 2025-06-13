import { useState } from "react"
import ConnectForm from "./ConnectForm"
import RegisterForm from "./RegisterForm"
import RegisterExternalAuthForm from "./RegisterExternalAuthForm"
import { AuthProviders } from "@/lib/utils"

interface Props {
    version: string
    onClose?: () => void
}

const Login = (p: Props) => {
    const [registering, setRegistering] = useState(false)
    const [registeringExternalAuth, setRegisteringExternalAuth] = useState<{ suggestedName: string, email: string, 
        token: string, provider: AuthProviders }>()
    
    return <>
        { !registering && ! registeringExternalAuth && <ConnectForm onClose={p.onClose} version={p.version}
            onRegisterRequested={() => setRegistering(true)} 
            onRegisterExternalAuthProviderRequested={(name, email, token, provider) => {
                setRegisteringExternalAuth({ suggestedName: name, email, token, provider })
            }}
        /> }
        { registering && <RegisterForm onClose={() => setRegistering(false)} version={p.version} 
            onRegisterExternalAuthProviderRequested={(name, email, token, provider) => {
                setRegisteringExternalAuth({ suggestedName: name, email, token, provider })
            }}
        /> }
        { registeringExternalAuth && <RegisterExternalAuthForm {...registeringExternalAuth} version={p.version}
        onClose={() => setRegisteringExternalAuth(undefined)} /> }
    </> 
}

export default Login