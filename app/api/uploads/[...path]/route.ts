import { readFile } from 'node:fs/promises'
import { join, normalize, extname } from 'node:path'
import { UPLOAD_DIR } from '@/lib/env'

const TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const rel = normalize(path.join('/'))
  // 防目录穿越
  if (rel.startsWith('..') || rel.includes('..')) {
    return new Response('Not found', { status: 404 })
  }
  // 只允许图片类型，避免把目录里的其它文件当静态资源吐出
  const type = TYPES[extname(rel).toLowerCase()]
  if (!type) return new Response('Not found', { status: 404 })

  try {
    const data = await readFile(join(UPLOAD_DIR, rel))
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': type,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
