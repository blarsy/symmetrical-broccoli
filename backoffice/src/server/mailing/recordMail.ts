import { randomUUID } from 'crypto'
import { writeFile, appendFile } from 'fs/promises'

const mailPath = process.env.MAIL_PATH

interface Message {
    to: string,
    from: string,
    subject: string,
    text: string,
    html: string
  }

export const recordMail = async (msg: Message) => {
    const uuid = randomUUID()
    const promises: Promise<any>[] = []

    console.log(`${mailPath}${uuid}`)
    promises.push(writeFile(`${mailPath}${uuid}.txt`, msg.text))
    promises.push(writeFile(`${mailPath}${uuid}.html`, msg.html))
    promises.push(appendFile(`${mailPath}mails.txt`, JSON.stringify({ date: new Date(), to: msg.to, subject: msg.subject })+ '\n')) 

    await Promise.all(promises)
}