import { PropsWithChildren, useEffect, useState } from "react"
import { ethers } from 'ethers'
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { Button, CircularProgress, Container, Stack } from "@mui/material"
import Feedback from "./Feedback"
import config from "@/config"
import Link from "next/link"
import { ApolloProvider, gql } from "@apollo/client"
import { getApolloClient } from "@/lib/apolloClient"
import Themed from "./Themed"
import useAccountFunctions from "@/lib/useAccountFunctions"

declare global {
    interface Window {
        ethereum?: any
    }
}

interface Props extends PropsWithChildren {
    version: string
}

const AdminLayout = (p : Props) => {
    const [connectionStatus, setConnectionStatus] = useState<DataLoadState<string>>(initial(true))
    const { apiUrl } = config(p.version)
    const {disconnect} = useAccountFunctions(p.version)

    const getChallengeFromServer = async (publicKey: string) => {
        const qry = await fetch(`${apiUrl}/adminchallenge`, { 
            method: 'POST',
            headers: {
            Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                publickey: publicKey
            })
        })

        if(qry.status != 200) throw new Error(`admin token request failed with error '${qry.statusText}'`)

        const res = await qry.json()
        return res.challenge as string
    }

    const getAdminTokenFromResponse = async(challenge: string, signature: string, publicKey: string) => {
        const qry = await fetch(`${apiUrl}/adminauth`, { 
            method: 'POST',
            headers: {
            Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                challenge,
                signature,
                publickey: publicKey
            })
        })

        if(qry.status != 200) throw new Error(`admin token request failed with error '${qry.statusText}'`)

        const res = await qry.json()
        return res.token
    }

    const tryConnect = async () => {
        if(window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum)
                // provider.on('accountsChanged', tryConnect)
                // provider.on('chainChanged', tryConnect)
    
                await provider.send("eth_requestAccounts", [])

                const signer = await provider.getSigner()
                const tokenRequestString = await getChallengeFromServer(signer.address)

                // sign the code
                const signature = await signer.signMessage(tokenRequestString)

                // send the code, and get the token as a return
                const exchangeToken = await getAdminTokenFromResponse(tokenRequestString, signature, signer.address)

                const client = getApolloClient(p.version)

                const exchangeRes = await client.mutate({ mutation: gql`mutation GetAdminToken($exchangeToken: String) {
                    getAdminToken(input: {exchangeToken: $exchangeToken}) {
                        jwtToken
                    }
                }`, variables: { exchangeToken } })

                const adminToken = exchangeRes.data.getAdminToken.jwtToken

                localStorage.setItem('adminToken', adminToken)
                setConnectionStatus(fromData(adminToken))
            } catch (ex) {
                setConnectionStatus(fromError(ex, 'There was a failure connecting your wallet account.'))
            }
        } else {
            setConnectionStatus(fromError(new Error('Metamask not detected'), 'Could not detect Metamask, is it installed ?'))
        }
    }

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken')
        if(adminToken) {
            setConnectionStatus(fromData(adminToken))
        } else {
            tryConnect()
        }
    }, [])

    return <Themed>
        <Container maxWidth="xl" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'}}>
            { connectionStatus.loading && <CircularProgress/> }
            { connectionStatus.error && <Feedback severity="error" message="Error connecting" 
                detail={connectionStatus.error.detail} onClose={() => setConnectionStatus(initial(false))} /> }
            { connectionStatus.data && [
                <Stack direction="row" key="bar" paddingTop="1rem">
                    <Button>
                        <Link href={`/webapp/${p.version}/admin/accounts`}>Accounts</Link>
                    </Button>
                    <Button>
                        <Link href={`/webapp/${p.version}/admin/mails`}>Mails</Link>
                    </Button>
                </Stack>,
                <ApolloProvider key="content" client={getApolloClient(p.version, connectionStatus.data, disconnect)}>
                    {p.children}
                </ApolloProvider>
            ]}
            { !connectionStatus.loading && !connectionStatus.data && <Button onClick={tryConnect}>Connect</Button>}
        </Container>
    </Themed>
}

export default AdminLayout