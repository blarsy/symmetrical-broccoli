import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { Readable } from 'stream';
import settings from './settings.js';
let service;
export const connectDrive = async () => {
    if (!service) {
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/drive',
            credentials: {
                client_email: settings.googleServiceAccount,
                private_key: settings.googlePrivateKey
            }
        });
        service = google.drive({ version: 'v3', auth });
    }
    return service;
};
let workingFolder;
export const getWorkingFolder = async (service, folderName) => {
    if (!workingFolder) {
        const res = await service.files.list({
            q: `name = '${folderName}' and mimeType='application/vnd.google-apps.folder'`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });
        if (res.data?.files?.length === 1) {
            workingFolder = res.data.files[0];
        }
        else {
            throw new Error(`Remote working folder ${folderName} not found`);
        }
    }
    return workingFolder;
};
const getChildFolder = async (service, folderName, parentFolderId) => {
    const res = await service.files.list({
        q: `name = '${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents`,
        fields: 'files(id, name)',
        spaces: 'drive',
    });
    if (res.data?.files?.length === 1) {
        return res.data.files[0];
    }
    else {
        return null;
    }
};
export const getOrCreateFolder = async (service, folderName, parentFolderId) => {
    let folder = await getChildFolder(service, folderName, parentFolderId);
    if (!folder) {
        const res = await service.files.create({
            requestBody: {
                parents: [parentFolderId],
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            }
        });
        if (res.status === 200) {
            folder = res.data;
        }
        else {
            throw new Error(`remote folder creation failed with status ${res.status} : ${res.statusText}`);
        }
    }
    return folder;
};
export const updateFile = async (service, fileId, content) => {
    await service.files.update({
        fileId: fileId,
        media: {
            body: Readable.from([JSON.stringify(content)])
        }
    });
};
export const createOrReplaceFile = async (service, filename, parentFolderId, content) => {
    const existingFileId = await getFileId(service, filename, parentFolderId);
    let res;
    if (existingFileId) {
        res = await service.files.update({
            fileId: existingFileId,
            media: {
                body: content
            }
        });
    }
    else {
        res = await service.files.create({
            media: {
                body: content,
                mimeType: 'text/plain',
            },
            requestBody: {
                parents: [parentFolderId],
                name: filename,
            }
        });
    }
    if (res.status != 200) {
        throw new Error(`remote file creation/update failed with status ${res.status} : ${res.statusText}`);
    }
};
export const getFileContent = async (service, fileId) => {
    const fileContent = await service.files.get({
        fileId: fileId,
        alt: 'media'
    }, { responseType: 'stream' });
    return new Promise((resolve, reject) => {
        let content = '';
        fileContent.data.on('end', () => {
            resolve(content);
        });
        fileContent.data.on('data', data => content += data);
        fileContent.data.on('error', e => reject(e));
    });
};
export const getFileId = async (service, name, parentFolderId) => {
    const res = await service.files.list({
        q: `name = '${name}' and '${parentFolderId}' in parents`,
        fields: 'files(id)',
        spaces: 'drive',
    });
    if (res.data?.files?.length === 1) {
        return res.data.files[0].id;
    }
    else {
        return '';
    }
};
const archiveFile = async (service, fileId, archivePrefix, parentFolderId) => {
    await service.files.copy({
        fileId,
        requestBody: {
            name: (`${archivePrefix}${Number(new Date())}`),
            parents: [parentFolderId]
        }
    });
    await service.files.delete({
        fileId
    });
};
export const createRemoteFile = async (service, fileContent, fileName, workingFolderName) => {
    const parentFolder = await getWorkingFolder(service, workingFolderName);
    const existingDataFileId = await getFileId(service, fileName, parentFolder.id);
    if (existingDataFileId) {
        await archiveFile(service, existingDataFileId, fileName, parentFolder.id);
    }
    const res = await service.files.create({
        media: {
            body: Readable.from([JSON.stringify(fileContent)]),
            mimeType: 'application/json',
        },
        requestBody: {
            parents: [parentFolder.id],
            name: fileName,
        }
    });
    if (res.status === 200) {
        return res.data;
    }
    else {
        throw new Error(`remote file creation failed with status ${res.status} : ${res.statusText}`);
    }
};
