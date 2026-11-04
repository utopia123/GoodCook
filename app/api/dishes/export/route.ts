import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { dishes, dishCategories } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/user'

/** 导出全部分类与菜品（不含图片文件）为 JSON 下载 */
export async function GET() {
  const me = await getCurrentUser()
  if (!me) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

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
    })),
  }

  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="goodcook-dishes-${date}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
