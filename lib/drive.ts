import { google } from "googleapis"
import { getDriveToken, saveDriveToken } from "./blob"

const SCOPES = ["https://www.googleapis.com/auth/drive.file"]

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.NEXTAUTH_URL}/api/drive/callback`
  )
}

export function getAuthUrl() {
  const client = getOAuthClient()
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  })
}

export async function exchangeCode(code: string) {
  const client = getOAuthClient()
  const { tokens } = await client.getToken(code)
  await saveDriveToken(tokens)
  return tokens
}

export async function getDriveClient() {
  const token = await getDriveToken()
  if (!token) throw new Error("Google Drive not connected. Please authorize via Admin > Setup Drive.")

  const client = getOAuthClient()
  client.setCredentials(token as Parameters<typeof client.setCredentials>[0])

  client.on("tokens", async (newTokens) => {
    const current = ((await getDriveToken()) as object) ?? {}
    await saveDriveToken({ ...current, ...newTokens })
  })

  return google.drive({ version: "v3", auth: client })
}

export async function uploadPhotoToDrive(imageBuffer: Buffer, filename: string): Promise<string> {
  const drive = await getDriveClient()
  const folderName = new Date().toISOString().split("T")[0]
  const folderId = await getOrCreateFolder(drive, folderName)

  const { Readable } = await import("stream")
  const body = Readable.from(imageBuffer)

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType: "image/jpeg",
      body,
    },
    fields: "id,webViewLink",
  })

  return res.data.webViewLink ?? `https://drive.google.com/file/d/${res.data.id}`
}

async function getOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  folderName: string
): Promise<string> {
  const res = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
  })

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!
  }

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  })

  return folder.data.id!
}
