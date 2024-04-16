import { exec } from 'child_process'
import settings from '../config'
import { rm } from 'fs/promises'
import { connectDrive, createOrReplaceFile, getWorkingFolder } from './drive'
import dayjs from 'dayjs'
import { createReadStream } from 'fs'

const copyBackupToDrive = async (backupFilename: string, backupFilePath: string) => {
    const service = await connectDrive()
    const workDir = await getWorkingFolder(service, settings.remoteBackupFolderName)
    return createOrReplaceFile(service, backupFilename, workDir.id!, createReadStream(backupFilePath))
}

const bcpCommand = '/usr/bin/pg_dump'

export const dailyBackup = async () => {
    const backupFilename = `backup${dayjs(new Date()).format('YYYYMMDD')}.sql`
    const backupFilePath = `./${backupFilename}`

    await new Promise((res, rej) => {
        exec(`${bcpCommand} 'postgresql://${settings.user}:${settings.dbPassword}@${settings.host}:${settings.port}/${settings.db}' -f ${backupFilePath}`, (err, outStream, errStream) => {
            if(err) {
                rej(errStream)
            } else {
                res(outStream)
            }
        })
    })

    await copyBackupToDrive(backupFilename, backupFilePath)
    
    return rm(`${backupFilePath}`)
}