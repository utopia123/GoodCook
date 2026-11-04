'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useT } from '@/components/i18n-provider'
import {
  createCondiment,
  updateCondiment,
  deleteCondiment,
} from '@/lib/actions/condiments'
import type { Condiment } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

const KINDS = ['aromatic', 'spice', 'seasoning'] as const
type Kind = (typeof KINDS)[number]

export function CondimentForm({
  mode,
  item,
  children,
}: {
  mode: 'create' | 'edit'
  item?: Condiment
  children: React.ReactNode
}) {
  const router = useRouter()
  const t = useT()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(item?.name ?? '')
  const [kind, setKind] = useState<Kind>((item?.kind as Kind) ?? 'seasoning')
  const [note, setNote] = useState(item?.note ?? '')
  const [effect, setEffect] = useState(item?.effect ?? '')
  const [goodWith, setGoodWith] = useState(item?.goodWith ?? '')
  const [avoidWith, setAvoidWith] = useState(item?.avoidWith ?? '')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    setError('')
    if (!name.trim()) return setError(t('err.condimentNameRequired'))
    const form = new FormData()
    form.set('name', name)
    form.set('kind', kind)
    form.set('note', note)
    form.set('effect', effect)
    form.set('goodWith', goodWith)
    form.set('avoidWith', avoidWith)
    startTransition(async () => {
      const res =
        mode === 'create'
          ? await createCondiment(form)
          : await updateCondiment(item!.id, form)
      if (res.ok) {
        setOpen(false)
        if (mode === 'create') {
          setName('')
          setNote('')
          setEffect('')
          setGoodWith('')
          setAvoidWith('')
        }
        router.refresh()
      } else setError(res.error)
    })
  }

  const remove = () =>
    startTransition(async () => {
      await deleteCondiment(item!.id)
      setOpen(false)
      router.refresh()
    })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        title={mode === 'create' ? t('condiments.addTitle') : t('condiments.editTitle')}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="cond-name">{t('condiments.name')}</Label>
            <Input
              id="cond-name"
              placeholder={t('condiments.namePh')}
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label>{t('condiments.kind')}</Label>
            <div className="flex gap-2">
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    'flex-1 rounded-full px-3 py-2 text-sm transition-colors',
                    kind === k
                      ? 'bg-accent/15 font-semibold text-accent ring-1 ring-accent/40'
                      : 'mf-inset text-secondary hover:text-ink',
                  )}
                >
                  {t(`condiments.kind.${k}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="cond-effect">{t('condiments.effect')}</Label>
            <Textarea
              id="cond-effect"
              placeholder={t('condiments.effectPh')}
              value={effect}
              maxLength={200}
              className="min-h-[64px]"
              onChange={(e) => setEffect(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="cond-good">{t('condiments.goodWith')}</Label>
            <Textarea
              id="cond-good"
              placeholder={t('condiments.goodWithPh')}
              value={goodWith}
              maxLength={200}
              className="min-h-[64px]"
              onChange={(e) => setGoodWith(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="cond-avoid">{t('condiments.avoidWith')}</Label>
            <Textarea
              id="cond-avoid"
              placeholder={t('condiments.avoidWithPh')}
              value={avoidWith}
              maxLength={200}
              className="min-h-[64px]"
              onChange={(e) => setAvoidWith(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="cond-note">{t('condiments.note')}</Label>
            <Textarea
              id="cond-note"
              placeholder={t('condiments.notePh')}
              value={note}
              maxLength={100}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button className="w-full" size="lg" loading={pending} onClick={submit}>
            {mode === 'create' ? t('common.add') : t('common.save')}
          </Button>

          {mode === 'edit' && (
            <Button
              variant="danger"
              size="sm"
              className="w-full"
              onClick={remove}
            >
              <Trash2 className="h-4 w-4" />
              {t('common.delete')}
            </Button>
          )}

          <DialogClose className="sr-only">{t('common.cancel')}</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
