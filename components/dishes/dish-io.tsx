'use client'

import { useRef, useState, useTransition } from 'react'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/components/i18n-provider'
import { importDishes } from '@/lib/actions/dishes'

/** 菜品页导出（JSON 下载）与导入（选择文件，同名跳过） */
export function DishIo() {
  const t = useT()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [pending, startTransition] = useTransition()

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setError('')
    setResult('')
    if (!f.name.toLowerCase().endsWith('.json')) {
      return setError(t('err.importInvalid'))
    }
    startTransition(async () => {
      const text = await f.text()
      const res = await importDishes(text)
      if (!res.ok) return setError(res.error ?? t('err.importInvalid'))
      if (res.imported === 0) {
        setResult(t('dishes.importNothing'))
      } else {
        setResult(
          t('dishes.importResult', {
            n: res.imported ?? 0,
            m: res.skipped ?? 0,
            k: res.categoriesAdded ?? 0,
          }),
        )
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {/* 导出：直接走 GET 下载 */}
        <a href="/api/dishes/export" download>
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
          accept=".json,application/json"
          className="hidden"
          onChange={pick}
        />
      </div>
      {result && <p className="text-xs text-accent">{result}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
