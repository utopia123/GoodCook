// 依赖数据库与登录态，禁止构建期预渲染
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import JSZip from 'jszip'
import { db } from '@/lib/db/client'
import { dishes, dishCategories } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/user'
import { UPLOAD_DIR } from '@/lib/env'

/**
 * 菜品导出：
 * - 默认 JSON（轻量，不含图片）
 * - ?format=zip → 完整菜品备份（dishes.json + images/ 图片文件）
 *   只含菜品相关数据，不含用户/饭局等其他数据
 */
export async function GET(request: Request) {
  const me = await getCurrentUser()
  if (!me) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const format =
    new URL(request.url).searchParams.get('format') === 'zip' ? 'zip' : 'json'

  const cats = db
    .select()
    .from(dishCategories)
    .orderBy(asc(dishCategories.sortOrder))
    .all()
  const all = db.select().from(dishes).all()

  const nameOf = new Map(cats.map((c) => [c.id, c.name]))
  const payload = {
    app: 'goodcook',
    type: 'dishes',
    version: 1,
    exportedAt: new Date().toISOString(),
    categories: cats.map((c) => c.name),
    dishes: all.map((d) => ({
      name: d.name,
      description: d.description,
      tags: d.tags ?? [],
      category: d.categoryId ? (nameOf.get(d.categoryId) ?? null) : null,
      imagePath: d.imagePath,
    })),
  }

  const date = new Date().toISOString().slice(0, 10)

  if (format === 'json') {
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="goodcook-dishes-${date}.json"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  // zip：dishes.json + images/<imagePath>
  const zip = new JSZip()
  zip.file('dishes.json', JSON.stringify(payload, null, 2))

  for (const d of all) {
    if (!d.imagePath) continue
    // 仅打包菜品图片（dishes/ 子目录），头像不导出
    if (!d.imagePath.startsWith('dishes/')) continue
    try {
      const buf = await readFile(join(UPLOAD_DIR, d.imagePath))
      zip.file(`images/${d.imagePath}`, buf)
    } catch {
      // 图片文件缺失时跳过，不阻断导出
    }
  }

  const buf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="goodcook-dishes-${date}.zip"`,
      'Cache-Control': 'no-store',
    },
  })
}
