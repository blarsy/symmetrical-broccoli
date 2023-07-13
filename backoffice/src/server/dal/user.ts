import { createToken, getAccount, queryAccount } from "../apiutil"
import bcrypt from 'bcrypt'
import { link, list, create as nocoCreate, unlink, update } from '../noco'
import { Account, fromRawAccount } from "@/schema"

const INITIAL_BALANCE = 5

export const authenticate = async(email: string, password: string) => {
    const account = await queryAccount(`(email,eq,${email})`, ['Id', 'nom', 'email', 'balance', 'hash'])
    console.log('email', email, 'password', password, 'hash', account.hash)
    const success = await bcrypt.compare(password, account.hash!)
    if(success) {
        const token = await createToken(process.env.JWT_SECRET as string, { email })
        // make sure we don't return the hash to the caller
        return {
            token,
            account:{
                id: account.id, name: account.name, balance: account.balance,
                email: account.email, 
            }
        }
    } else {
        throw new Error('Authentication failed')
    }
}

export const create = async (name: string, email: string, password: string): Promise<Account> => {
    const salt = await bcrypt.genSalt()
    const hash = await bcrypt.hash(password, salt)
    const accountRaw = await nocoCreate('comptes', { email, nom: name, salt, hash, balance: INITIAL_BALANCE  })
    return fromRawAccount(accountRaw)
}

export const invite = async (email: string, target: string) => {
    const account = await queryAccount('', ['Id', 'comptes_invites', 'comptes_liés'], {
        query: {
            'where': `(email,eq,${email})`,
            'nested[comptes_invites][fields]': 'nom,email,Id',
            'nested[comptes_liés][fields]': 'nom,email,Id'
        }
    })

    if(Number(target) === account.id) throw new Error('Invalid')
    if(account.invitedAccounts.some(invited => invited.id === Number(target))) throw new Error('Duplicate request')
    console.log(account.linkedAccounts)
    if(account.linkedAccounts.some(linked => linked.id === Number(target))) throw new Error('Already linked')

    await link('comptes', account.id, 'comptes_invites', target)
}

export const uninvite = async (email: string, target: string) => {
    const account = await queryAccount(`(email,eq,${email})`, ['Id', 'comptes_invites'])

    if(Number(target) === account.id) throw new Error('Invalid')

    await unlink("comptes", account.id, 'comptes_invites', target)
}

export const answerInvite = async (email: string, target: string, accept: boolean) => {
    const account = await queryAccount(`(email,eq,${email})`, ['Id', 'comptes List1'])

    const linkToProcess = account.invitedByAccounts.map(acc => acc.id === account.id)
    if(!linkToProcess) throw new Error('Request not found')

    if(accept) {
        await link('comptes', account.id, 'comptes_liés', target as string)
        await link('comptes', Number(target), 'comptes_liés', account.id.toString())
    }
    await unlink('comptes', Number(target), 'comptes_invites', account.id.toString())
}

export const getInvitableAccounts = async (search: string, token: string): Promise<Account[]> => {
    const sourceAccount = await getAccount(token, ['Id', 'nom', 'email', 'comptes_invites', 'comptes_liés'])
    const rawResult = await list('comptes', `(email,like,${search})~or(nom,like,${search})`, ['Id', 'nom', 'email'])
    const result = rawResult.map(acc => fromRawAccount(acc))
    const filteredResult = result.filter(acc => 
        acc.id != sourceAccount.id &&
        !sourceAccount.invitedAccounts.some(invited => invited.id === acc.id) &&
        !sourceAccount.linkedAccounts.some(linked => linked.id === acc.id))

    return filteredResult
}