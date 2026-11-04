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
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '@/lib/actions/recipes'
import type { Recipe } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

const DIFFS = ['easy', 'medium', 'hard'] as const
type Difficulty = (typeof DIFFS)[number]

export function RecipeForm({
  mode,
  recipe,
  children,
}: {
  mode: 'create' | 'edit'
  recipe?: Recipe
  children: React.ReactNode
}) {
  const router = useRouter()
  const t = useT()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(recipe?.title ?? '')
  const [minutes, setMinutes] = useState(
    recipe?.minutes ? String(recipe.minutes) : '',
  )
  const [difficulty, setDifficulty] = useState<Difficulty>(
    (recipe?.difficulty as Difficulty) ?? 'easy',
  )
  const [ingredients, setIngredients] = useState(recipe?.ingredients ?? '')
  const [steps, setSteps] = useState(recipe?.steps ?? '')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    setError('')
    if (!title.trim()) return setError(t('err.recipeTitleRequired'))
    const form = new FormData()
    form.set('title', title)
    form.set('minutes', minutes)
    form.set('difficulty', difficulty)
    form.set('ingredients', ingredients)
    form.set('steps', steps)
    startTransition(async () => {
      const res =
        mode === 'create'
          ? await createRecipe(form)
          : await updateRecipe(recipe!.id, form)
      if (res.ok) {
        setOpen(false)
        if (mode === 'create') {
          setTitle('')
          setMinutes('')
          setIngredients('')
          setSteps('')
        }
        router.refresh()
      } else setError(res.error)
    })
  }

  const remove = () =>
    startTransition(async () => {
      await deleteRecipe(recipe!.id)
      setOpen(false)
      router.refresh()
    })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        title={mode === 'create' ? t('recipes.addTitle') : t('recipes.editTitle')}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="rec-title">{t('recipes.titleField')}</Label>
            <Input
              id="rec-title"
              placeholder={t('recipes.titlePh')}
              value={title}
              maxLength={40}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <div className="w-28 shrink-0">
              <Label htmlFor="rec-min">{t('recipes.minutes')}</Label>
              <Input
                id="rec-min"
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                placeholder="30"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label>{t('recipes.difficulty')}</Label>
              <div className="flex gap-2">
                {DIFFS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      'h-11 flex-1 rounded-full text-sm transition-colors',
                      difficulty === d
                        ? 'bg-accent/15 font-semibold text-accent ring-1 ring-accent/40'
                        : 'mf-inset text-secondary hover:text-ink',
                    )}
                  >
                    {t(`recipes.diff.${d}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="rec-ing">{t('recipes.ingredients')}</Label>
            <Textarea
              id="rec-ing"
              placeholder={t('recipes.ingredientsPh')}
              value={ingredients}
              className="min-h-[96px]"
              onChange={(e) => setIngredients(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="rec-steps">{t('recipes.steps')}</Label>
            <Textarea
              id="rec-steps"
              placeholder={t('recipes.stepsPh')}
              value={steps}
              className="min-h-[140px]"
              onChange={(e) => setSteps(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button className="w-full" size="lg" loading={pending} onClick={submit}>
            {mode === 'create' ? t('common.add') : t('common.save')}
          </Button>

          {mode === 'edit' && (
            <Button variant="danger" size="sm" className="w-full" onClick={remove}>
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
