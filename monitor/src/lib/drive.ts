import { GoogleAuth } from 'google-auth-library'
import { google, drive_v3 } from 'googleapis'

const googleServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT as string
const googlePrivateKey = JSON.parse(process.env.GOOGLE_PRIVATE_KEY as string).privateKey

let service: drive_v3.Drive
export const connectDrive = async (): Promise<drive_v3.Drive> => {

    if(!service) {
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/drive',
            credentials: {
                client_email: googleServiceAccount,
                private_key: googlePrivateKey
            }
        })
    
        service = google.drive({version: 'v3', auth})
    }
    return service
}

let workingFolder : drive_v3.Schema$File
export const getWorkingFolder = async (service: drive_v3.Drive, folderName: string): Promise<drive_v3.Schema$File> => {
    if(!workingFolder) {
        const res = await service.files.list({
            q: `name = '${folderName}' and mimeType='application/vnd.google-apps.folder'`,
            fields: 'files(id, name)',
            spaces: 'drive',
        })
        if (res.data?.files?.length === 1) {
            workingFolder = res.data.files[0]
        } else {
            throw new Error(`Remote working folder ${folderName} not found`)
        }
    }
    return workingFolder
}


export const getFilesInFolder = async (service: drive_v3.Drive, folderId: string) => {
    const list = await service.files.list({
        q: `'${folderId}' in parents`,
        fields: 'files(id)',
        spaces: 'drive',
    })
    if(list.data && list.data.files){
        return list.data.files
    } else {
        return []
    }
}

