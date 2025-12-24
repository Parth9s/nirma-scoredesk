import { google } from 'googleapis';
import { Stream } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

// OAuth 2.0 Config (User provided Refresh Token)
// OAuth 2.0 Config
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// Prefer Env Var, fallback to hardcoded (which is likely expired)
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || '1//04AnYa0tTk3TcCgYIARAAGAQSNwF-L9Ir-CT7Dd8lzSi0K9uzSd_1imr8eCfa65KdU_zDP112JqdWnsmSqmCrWCCQICM_dxNLq50';

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
auth.setCredentials({ refresh_token: REFRESH_TOKEN });

console.log("DEBUG: Drive Auth Initialized (OAuth2)");

const drive = google.drive({ version: 'v3', auth });

// Root Folder ID (from Env or Static fallback)
const ROOT_FOLDER_ID = process.env.DRIVE_ROOT_FOLDER_ID || '1yV3ksY_hajXlL5WM3EBcu3_zZO8xv2Xd';
console.log("DEBUG: Root Folder ID:", ROOT_FOLDER_ID);

export async function getDriveClient() {
    return drive;
}

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

    // Default to ROOT/Pending if no folder provided? 
    // Actually, plan says default to "Pending".
    // Let's assume the caller provides the target folder ID or we find "Pending" inside Root.

    // For simplicity V1: Just upload to the target folder ID passed.
    // If we need to find "Pending" dynamically, we can do that too.

    const targetFolderId = folderId || await getFolderId('Pending', ROOT_FOLDER_ID!);

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
        await drive.files.delete({
            fileId,
        });
        console.log(`[Drive] Deleted file: ${fileId}`);
    } catch (error) {
        console.error(`[Drive] Failed to delete file ${fileId}:`, error);
        // Don't throw, just log. We don't want to break the app if Drive fails.
    }
}
