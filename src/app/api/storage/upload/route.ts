import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import path from 'path'

/**
 * GCS File Upload API
 * Securely uploads files to Google Cloud Storage from backend
 */

// Initialize GCS client
let storage: Storage | null = null

function getStorage(): Storage {
  if (!storage) {
    // Option 1: Using service account key file (supports relative paths)
    if (process.env.GCS_KEY_FILE) {
      // Resolve relative paths from project root
      const keyFilePath = process.env.GCS_KEY_FILE.startsWith('.')
        ? path.resolve(process.cwd(), process.env.GCS_KEY_FILE)
        : process.env.GCS_KEY_FILE
      
      storage = new Storage({
        keyFilename: keyFilePath,
      })
    }
    // Option 2: Using service account key JSON string
    else if (process.env.GCS_CREDENTIALS) {
      const credentials = JSON.parse(process.env.GCS_CREDENTIALS)
      storage = new Storage({
        credentials,
      })
    }
    // Option 3: Default credentials (works in GCP environments)
    else {
      storage = new Storage()
    }
  }
  return storage
}

export async function POST(request: NextRequest) {
  try {
    const bucketName = process.env.GCS_BUCKET_NAME

    if (!bucketName) {
      return NextResponse.json(
        { error: 'GCS bucket not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const goalId = formData.get('goalId') as string
    const travelId = formData.get('travelId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!userId || !goalId || !travelId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    const storage = getStorage()
    const bucket = storage.bucket(bucketName)

    // Generate unique file path
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `travel/${userId}/${goalId}/${travelId}/${timestamp}_${sanitizedFileName}`

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to GCS
    const gcsFile = bucket.file(storagePath)
    await gcsFile.save(buffer, {
      contentType: file.type,
      metadata: {
        metadata: {
          uploadedBy: userId,
          goalId,
          travelId,
          originalName: file.name,
        },
      },
    })

    // Make file publicly readable (optional - you can use signed URLs instead)
    // await gcsFile.makePublic()

    // Generate signed URL (valid for 7 days)
    const [signedUrl] = await gcsFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return NextResponse.json({
      success: true,
      file: {
        id: `${timestamp}_${sanitizedFileName}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: signedUrl,
        storagePath,
        uploadedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error uploading file to GCS:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
