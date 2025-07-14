import { useState } from "react"
import ConnectForm from "./ConnectForm"
import RegisterForm from "./RegisterForm"
import RegisterExternalAuthForm from "./RegisterExternalAuthForm"
import { AuthProviders } from "@/lib/utils"
import TriggerPasswordRecovery from "./TriggerPasswordRecovery"

interface Props {
    version: string
    onClose?: () => void
}

const Login = (p: Props) => {
    const [registering, setRegistering] = useState(false)
    const [registeringExternalAuth, setRegisteringExternalAuth] = useState<{ suggestedName: string, email: string, 
        token: string, provider: AuthProviders }>()
    const [recoveringPassword, setRecoveringPassword] = useState(false)

    if(registering) {
        return <RegisterForm onClose={() => setRegistering(false)} version={p.version} 
            onRegisterExternalAuthProviderRequested={(name, email, token, provider) => {
                setRegisteringExternalAuth({ suggestedName: name, email, token, provider })
            }}
        />
    } else if(registeringExternalAuth) {
        return <RegisterExternalAuthForm {...registeringExternalAuth} version={p.version}
            onClose={() => setRegisteringExternalAuth(undefined)} />
    } else if(recoveringPassword) {
        return <TriggerPasswordRecovery onCancel={() => setRecoveringPassword(false)}/>
    } else {
        return <ConnectForm onClose={p.onClose} version={p.version}
            onRegisterRequested={() => setRegistering(true)} 
            onRegisterExternalAuthProviderRequested={(name, email, token, provider) => {
                setRegisteringExternalAuth({ suggestedName: name, email, token, provider })
            }}
            onPasswordRecoveryRequested={() => setRecoveringPassword(true)}
        />
    }
}

export default Login