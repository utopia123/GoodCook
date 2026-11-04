'use client'

import { useRef, useState, useTransition } from 'react'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/components/i18n-provider'
import { importDishes, importDishesZip } from '@/lib/actions/dishes'

/** 菜品页导出（zip：菜品 JSON + 图片）与导入（兼容 zip 备份 / JSON） */
export function DishIo() {
  const t = useT()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [pending, startTransition] = useTransition()

  const showResult = (res: {
    ok: boolean
    error?: string
    imported?: number
    skipped?: number
    categoriesAdded?: number
    imagesRestored?: number
  }) => {
    if (!res.ok) return setError(res.error ?? t('err.importInvalid'))
    if (res.imported === 0) {
      setResult(t('dishes.importNothing'))
    } else {
      setResult(
        t('dishes.importResult', {
          n: res.imported ?? 0,
          m: res.skipped ?? 0,
          k: res.categoriesAdded ?? 0,
        }) +
          (res.imagesRestored
            ? t('dishes.importImages', { n: res.imagesRestored })
            : ''),
      )
    }
  }

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setError('')
    setResult('')
    const isZip = f.name.toLowerCase().endsWith('.zip')
    const isJson = f.name.toLowerCase().endsWith('.json')
    if (!isZip && !isJson) {
      return setError(t('err.importInvalid'))
    }
    startTransition(async () => {
      if (isJson) {
        const res = await importDishes(await f.text())
        showResult(res)
      } else {
        const form = new FormData()
        form.set('file', f)
        const res = await importDishesZip(form)
        showResult(res)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {/* 导出：zip 备份（菜品 JSON + 图片） */}
        <a href="/api/dishes/export?format=zip" download>
          <Button variant="trough" size="sm" type="button">
            <Download className="h-4 w-4" />
            {t('dishes.export')}
          </Button>
        </a>
        <Button
          variant="trough"
          size="sm"
          type="button"
          loading={pending}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {t('dishes.import')}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.zip"
          className="hidden"
          onChange={pick}
        />
      </div>
      {result && <p className="text-xs text-accent">{result}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
