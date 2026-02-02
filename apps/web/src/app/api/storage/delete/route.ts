import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import path from 'path'

/**
 * GCS File Delete API
 * Securely deletes files from Google Cloud Storage
 */

// Initialize GCS client
let storage: Storage | null = null

function getStorage(): Storage {
  if (!storage) {
    if (process.env.GCS_KEY_FILE) {
      // Resolve relative paths from project root
      const keyFilePath = process.env.GCS_KEY_FILE.startsWith('.')
        ? path.resolve(process.cwd(), process.env.GCS_KEY_FILE)
        : process.env.GCS_KEY_FILE
      
      storage = new Storage({
        keyFilename: keyFilePath,
      })
    } else if (process.env.GCS_CREDENTIALS) {
      const credentials = JSON.parse(process.env.GCS_CREDENTIALS)
      storage = new Storage({
        credentials,
      })
    } else {
      storage = new Storage()
    }
  }
  return storage
}

export async function DELETE(request: NextRequest) {
  try {
    const bucketName = process.env.GCS_BUCKET_NAME

    if (!bucketName) {
      return NextResponse.json(
        { error: 'GCS bucket not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const storagePath = searchParams.get('path')

    if (!storagePath) {
      return NextResponse.json(
        { error: 'Storage path required' },
        { status: 400 }
      )
    }

    const storage = getStorage()
    const bucket = storage.bucket(bucketName)
    const file = bucket.file(storagePath)

    // Check if file exists
    const [exists] = await file.exists()
    if (!exists) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Delete the file
    await file.delete()

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting file from GCS:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
