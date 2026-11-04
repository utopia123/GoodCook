import { Plus, FlaskConical } from 'lucide-react'
import { asc } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { condiments } from '@/lib/db/schema'
import { requireUser } from '@/lib/auth/user'
import { getT } from '@/lib/i18n/server'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { CondimentForm } from '@/components/condiments/condiment-form'

export const dynamic = 'force-dynamic'

const KINDS = ['aromatic', 'spice', 'seasoning'] as const

export default async function CondimentsPage() {
  await requireUser()
  const t = await getT()
  const all = db
    .select()
    .from(condiments)
    .orderBy(asc(condiments.createdAt))
    .all()

  return (
    <>
      <PageHeader
        title={t('condiments.title')}
        subtitle={t('condiments.count', { n: all.length })}
        action={
          <CondimentForm mode="create">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              {t('common.add')}
            </Button>
          </CondimentForm>
        }
      />

      {all.length === 0 ? (
        <EmptyState
          icon={<FlaskConical />}
          title={t('condiments.emptyTitle')}
          description={t('condiments.emptyDesc')}
          action={
            <CondimentForm mode="create">
              <Button>
                <Plus className="h-4 w-4" />
                {t('condiments.addFirst')}
              </Button>
            </CondimentForm>
          }
        />
      ) : (
        <div className="space-y-6">
          {KINDS.map((kind) => {
            const items = all.filter((c) => c.kind === kind)
            if (items.length === 0) return null
            return (
              <section key={kind}>
                <p className="mf-section mb-2 text-[13px] text-ink">
                  {t(`condiments.kind.${kind}`)}
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((c) => (
                    <CondimentForm key={c.id} mode="edit" item={c}>
                      <button
                        type="button"
                        className="mf-raised mf-pressable w-full p-3.5 text-left"
                      >
                        <span className="block truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
                          {c.name}
                        </span>
                        {c.effect && (
                          <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-secondary">
                            {c.effect}
                          </span>
                        )}
                        {(c.goodWith || c.avoidWith) && (
                          <span className="mt-2 block space-y-0.5 text-[11px] leading-relaxed">
                            {c.goodWith && (
                              <span className="flex gap-1.5">
                                <span className="shrink-0 font-medium text-accent">
                                  {t('condiments.good')}
                                </span>
                                <span className="line-clamp-1 text-secondary">
                                  {c.goodWith}
                                </span>
                              </span>
                            )}
                            {c.avoidWith && (
                              <span className="flex gap-1.5">
                                <span className="shrink-0 font-medium text-danger/80">
                                  {t('condiments.avoid')}
                                </span>
                                <span className="line-clamp-1 text-secondary">
                                  {c.avoidWith}
                                </span>
                              </span>
                            )}
                          </span>
                        )}
                      </button>
                    </CondimentForm>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}
