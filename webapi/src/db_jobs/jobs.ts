import { exec } from 'child_process'
import getConfig, { getCommonConfig } from '../config'
import { rm } from 'fs/promises'
import { connectDrive, createOrReplaceFile, getWorkingFolder } from './drive'
import dayjs from 'dayjs'
import { createReadStream } from 'fs'

const copyBackupToDrive = async (backupFilename: string, backupFilePath: string) => {
    const config = await getCommonConfig()
    const service = await connectDrive()
    const workDir = await getWorkingFolder(service, config.remoteBackupFolderName)
    return createOrReplaceFile(service, backupFilename, workDir.id!, createReadStream(backupFilePath))
}

export const dailyBackup = async (payload: { version: string }) => {
    const config = await getConfig(payload.version)
    
    const backupFilename = `backup${payload.version}${dayjs(new Date()).format('YYYYMMDD')}.sql`
    const backupFilePath = `./${backupFilename}`
    const bcpCommand = config.backupCommand

    await new Promise((res, rej) => {
        exec(`${bcpCommand} 'postgresql://${config.user}:${config.dbPassword}@${config.host}:${config.port}/${config.db}' -f ${backupFilePath} -Fc`, (err, outStream, errStream) => {
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