'use client'

import { useState, useTransition } from 'react'
import {
  Languages,
  KeyRound,
  Settings,
  LogOut,
  Palette,
  Type,
  ListOrdered,
  Sparkles,
  PanelBottom,
} from 'lucide-react'
import { List, Row } from '@/components/ui/list'
import { IconChip } from '@/components/ui/icon-chip'
import { LanguageSwitch } from '@/components/language-switch'
import { ThemeToggle } from '@/components/theme-toggle'
import { ThemeComposer } from '@/components/theme-composer'
import { NavAlphaSlider } from '@/components/me/nav-alpha'
import { UiScalePicker } from '@/components/me/ui-scale'
import { InsightCountPicker } from '@/components/me/insight-count'
import { ChangePassword } from '@/components/me/change-password'
import { useT } from '@/components/i18n-provider'
import { logout } from '@/lib/actions/auth'

export function SettingsList({
  isAdmin,
  insightCount,
}: {
  isAdmin: boolean
  insightCount: number
}) {
  const t = useT()
  const [pwOpen, setPwOpen] = useState(false)
  const [, startTransition] = useTransition()

  return (
    <>
      <List>
        <Row
          leading={
            <IconChip>
              <Languages />
            </IconChip>
          }
          title={t('me.language')}
          trailing={<LanguageSwitch className="w-[136px]" />}
          chevron={false}
        />
        <Row
          leading={
            <IconChip>
              <Sparkles />
            </IconChip>
          }
          title={t('theme.composer')}
          subtitle={t('theme.composerHint')}
          trailing={<ThemeComposer />}
          chevron={false}
        />
        <Row
          leading={
            <IconChip>
              <Palette />
            </IconChip>
          }
          title={t('theme.title')}
          trailing={<ThemeToggle />}
          chevron={false}
        />
        <Row
          leading={
            <IconChip>
              <PanelBottom />
            </IconChip>
          }
          title={t('nav.alpha')}
          subtitle={t('nav.alphaHint')}
          trailing={<NavAlphaSlider />}
          chevron={false}
        />
        <Row
          leading={
            <IconChip>
              <Type />
            </IconChip>
          }
          title={t('scale.title')}
          trailing={<UiScalePicker />}
          chevron={false}
        />
        <Row
          leading={
            <IconChip>
              <ListOrdered />
            </IconChip>
          }
          title={t('insight.countTitle')}
          subtitle={t('insight.countHint')}
          trailing={<InsightCountPicker value={insightCount} />}
          chevron={false}
        />
        <Row
          leading={
            <IconChip>
              <KeyRound />
            </IconChip>
          }
          title={t('me.changePassword')}
          onClick={() => setPwOpen(true)}
        />
        {isAdmin && (
          <Row
            leading={
              <IconChip>
                <Settings />
              </IconChip>
            }
            title={t('me.familyAdmin')}
            href="/admin"
          />
        )}
        <Row
          leading={
            <IconChip tone="danger">
              <LogOut />
            </IconChip>
          }
          title={<span className="text-danger">{t('me.logout')}</span>}
          onClick={() => startTransition(() => void logout())}
          chevron={false}
        />
      </List>

      <ChangePassword open={pwOpen} onOpenChange={setPwOpen} />
    </>
  )
}
