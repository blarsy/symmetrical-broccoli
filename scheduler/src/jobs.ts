import { exec } from 'child_process'
import settings from'./settings.js'
import { rm } from 'fs/promises'
import { connectDrive, createOrReplaceFile, getWorkingFolder } from './drive.js'
import dayjs from 'dayjs'
import { createReadStream } from 'fs'

const copyBackupToDrive = async (backupFilename: string, backupFilePath: string) => {
    const service = await connectDrive()
    const workDir = await getWorkingFolder(service, settings.remoteBackupFolderName)
    return createOrReplaceFile(service, backupFilename, workDir.id!, createReadStream(backupFilePath))
}

export default {
    dailyBackup: async () => {
        const backupFilename = `backup${dayjs(new Date()).format('YYYYMMDD')}.sql`
        const backupFilePath = `./${backupFilename}`

        await new Promise((res, rej) => {
            //This comment does not serve any semantic purpose
            exec(`/usr/bin/pg_dump 'postgresql://${settings.dbUser}:${settings.dbPassword}@${settings.dbHost}:${settings.dbPort}/${settings.dbName}' -f ${backupFilePath}`, (err, outStream, errStream) => {
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
} as { [name: string]: (data: any) => Promise<void> }