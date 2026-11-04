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
                <div className="mf-list">
                  {items.map((c) => (
                    <CondimentForm key={c.id} mode="edit" item={c}>
                      <button
                        type="button"
                        className="mf-row mf-row-press w-full text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium text-ink">
                            {c.name}
                          </span>
                          {c.effect && (
                            <span className="mt-0.5 block truncate text-xs text-secondary">
                              {c.effect}
                            </span>
                          )}
                        </span>
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
