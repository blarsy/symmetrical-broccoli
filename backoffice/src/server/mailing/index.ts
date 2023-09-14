import sgMail from '@sendgrid/mail'
import { readFile } from 'fs/promises'
import Handlebars from 'handlebars'
import { recordMail } from './recordMail'

const config = {
    mailApiKey: process.env.SENDGRID_API_KEY!,
    noreplyEmail: process.env.NOREPLY_EMAIL!,
    mailTemplatesLocation: process.env.MAIL_TEMPLATES_LOCATION!,
    websiteUrl: process.env.TOPELA_API_URL!,
    productName: 'Tope là',
    production: process.env.NODE_ENV!.toLowerCase() === 'production'
}

export const sendMail = async (from: string, to: string, subject: string, plainText: string, htmlContent: string) => {
    const msg = {
      to,
      from,
      subject,
      text: plainText,
      html: htmlContent
    }

    if(config.production){
        sgMail.setApiKey(config.mailApiKey)
        await sgMail.send(msg)
    } else {
        await recordMail(msg)
    }
}

export const sendNoReplyMail = async (to: string, subject: string, plainText: string, htmlContent: string) => {
    await sendMail(config.noreplyEmail, to, subject, plainText, htmlContent)
}

let partialsPreparePromise: Promise<void> | null = null
const preparePartials = async () => {
    if(!partialsPreparePromise) {
        partialsPreparePromise = new Promise(async (resolve, reject) => {
            try {
                const partial = (await readFile(`${config.mailTemplatesLocation}headerPartial.html`)).toString()
                Handlebars.registerPartial(
                    "headerPartial", 
                    partial
                )
                resolve()
            } catch(e) {
                reject(e)
            }
        })
    }
    return partialsPreparePromise
}

export const sendAccountRecoveryMail = async (email: string, code: string) => {
    const heading = 'Récupération de mot de passe'
    const text = `Voici un lien pour effectuer la récupération de votre mot de passe sur ${config.productName}: `
    const link = `${config.websiteUrl}/recover/${code}`

    await preparePartials()
    const source = await readFile(`${config.mailTemplatesLocation}adminInvite.html`)
    const template = Handlebars.compile(source.toString())

    const data = { heading, text,
        "button": 'Restauration', link, header: {
        logoUrl: `${config.websiteUrl}/logo.jpeg`
    }}
    const htmlContent = template(data)

    await sendNoReplyMail(email, heading, 
        `${text}${link}`, 
        htmlContent)
}