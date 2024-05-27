import { randomUUID } from 'crypto'
import { writeFile, appendFile } from 'fs/promises'
import { getCommonConfig } from '../config'


interface Message {
    to: string,
    from: string,
    subject: string,
    text: string,
    html: string
  }

export const recordMail = async (msg: Message) => {
    const config = await getCommonConfig()
    const uuid = randomUUID()
    const promises: Promise<any>[] = []

    promises.push(writeFile(`${config.mailPath}${uuid}.txt`, msg.text))
    promises.push(writeFile(`${config.mailPath}${uuid}.html`, msg.html))
    promises.push(appendFile(`${config.mailPath}mails.txt`, JSON.stringify({ date: new Date(), from: msg.from, to: msg.to, subject: msg.subject })+ '\n')) 

    await Promise.all(promises)
}