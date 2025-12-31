import { google } from 'googleapis';
import { Stream } from 'stream';

// Client Instance
let driveInstance: any = null;

export async function getDriveClient() {
    if (driveInstance) return driveInstance;

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    // Prefer Env Var, fallback to hardcoded (which is likely expired)
    const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

    console.log("DEBUG Drive Auth:", {
        hasClientId: !!CLIENT_ID,
        clientIdStart: CLIENT_ID?.substring(0, 10),
        hasClientSecret: !!CLIENT_SECRET,
        hasRefreshToken: !!REFRESH_TOKEN,
        refreshTokenStart: REFRESH_TOKEN?.substring(0, 5),
        isHardcodedToken: REFRESH_TOKEN?.startsWith('1//04A') // Check if it's the old one
    });

    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
        throw new Error("Missing Google Drive credentials (ID, Secret, or Token)");
    }

    const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    auth.setCredentials({ refresh_token: REFRESH_TOKEN });

    driveInstance = google.drive({ version: 'v3', auth });
    return driveInstance;
}

// Helper to get drive internally
async function getDrive() {
    return await getDriveClient();
}

// Root Folder ID (from Env or Static fallback)
const ROOT_FOLDER_ID = process.env.DRIVE_ROOT_FOLDER_ID || '1yV3ksY_hajXlL5WM3EBcu3_zZO8xv2Xd';
console.log("DEBUG: Root Folder ID:", ROOT_FOLDER_ID);

/**
 * Upload a file to the "Pending" folder (or specified folder)
 */
export async function uploadFileToDrive(
    fileStream: Stream,
    fileName: string,
    mimeType: string,
    folderId?: string
) {
    if (!ROOT_FOLDER_ID && !folderId) {
        throw new Error("ROOT_FOLDER_ID is not defined.");
    }

    const targetFolderId = folderId || await getFolderId('Pending', ROOT_FOLDER_ID!);

    const drive = await getDrive();
    const response = await drive.files.create({
        requestBody: {
            name: fileName,
            parents: [targetFolderId],
        },
        media: {
            mimeType,
            body: fileStream,
        },
        fields: 'id, name, webViewLink, webContentLink',
    });

    return response.data;
}

/**
 * Move a file from one folder to another
 */
export async function moveFile(fileId: string, currentFolderId: string, targetFolderId: string) {
    const drive = await getDrive();
    await drive.files.update({
        fileId,
        addParents: targetFolderId,
        removeParents: currentFolderId,
        fields: 'id, parents',
    });
}

/**
 * Make a file public (Reader for Anyone)
 */
export async function setPublicPermission(fileId: string) {
    const drive = await getDrive();
    await drive.permissions.create({
        fileId,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    });
}

/**
 * Find or Create a folder structure: Root -> Branch -> Sem -> [Target]
 * Returns the ID of the final folder.
 */
export async function ensureHierarchy(branchName: string, semester: number): Promise<string> {
    if (!ROOT_FOLDER_ID) throw new Error("ROOT_FOLDER_ID missing");

    // 1. Find/Create Branch Folder
    const branchFolderId = await getFolderId(branchName, ROOT_FOLDER_ID);

    // 2. Find/Create Semester Folder
    const semFolderName = `Sem ${semester}`;
    const semFolderId = await getFolderId(semFolderName, branchFolderId);

    return semFolderId;
}

/**
 * Helper: Get Folder ID by name within a parent, create if not exists
 */
async function getFolderId(name: string, parentId: string): Promise<string> {
    const drive = await getDrive();
    // Search
    const query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`;
    const res = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
    });

    if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id!;
    }

    // Create
    const createRes = await drive.files.create({
        requestBody: {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        },
        fields: 'id',
    });

    return createRes.data.id!;
}

export async function getPendingFolderId(): Promise<string> {
    if (!ROOT_FOLDER_ID) throw new Error("ROOT_FOLDER_ID missing");
    return await getFolderId('Pending', ROOT_FOLDER_ID);
}

/**
 * Permanently delete a file from Drive
 */
export async function deleteFile(fileId: string) {
    try {
        const drive = await getDrive();
        await drive.files.delete({
            fileId,
        });
        console.log(`[Drive] Deleted file: ${fileId}`);
    } catch (error) {
        console.error(`[Drive] Failed to delete file ${fileId}:`, error);
        // Don't throw, just log. We don't want to break the app if Drive fails.
    }
}

