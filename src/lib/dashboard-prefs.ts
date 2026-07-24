import type { TranslationKey } from '@/lib/i18n/translations'

export interface WidgetMeta { id: string; labelKey: TranslationKey; span: number }

export const WIDGETS: WidgetMeta[] = [
  { id: 'banner', labelKey: 'wBanner', span: 3 },
  { id: 'stats', labelKey: 'wStats', span: 3 },
  { id: 'quick', labelKey: 'wQuick', span: 3 },
  { id: 'payroll', labelKey: 'wPayroll', span: 2 },
  { id: 'status', labelKey: 'wStatus', span: 1 },
  { id: 'approvals', labelKey: 'wApprovals', span: 2 },
  { id: 'onboarding', labelKey: 'wOnboarding', span: 1 },
  { id: 'branch', labelKey: 'wBranch', span: 1 },
  { id: 'types', labelKey: 'wTypes', span: 1 },
  { id: 'activity', labelKey: 'wActivity', span: 1 },
]

export const DEFAULT_ORDER = WIDGETS.map((w) => w.id)

export interface DashPrefs { order: string[]; hidden: string[] }

export function loadPrefs(): DashPrefs {
  if (typeof window === 'undefined') return { order: DEFAULT_ORDER, hidden: [] }
  try {
    const p = JSON.parse(localStorage.getItem('dashPrefs') || 'null')
    if (p && Array.isArray(p.order)) {
      const order = [
        ...p.order.filter((id: string) => DEFAULT_ORDER.includes(id)),
        ...DEFAULT_ORDER.filter((id) => !p.order.includes(id)),
      ]
      return { order, hidden: Array.isArray(p.hidden) ? p.hidden : [] }
    }
  } catch { /* ignore */ }
  return { order: DEFAULT_ORDER, hidden: [] }
}

export function savePrefs(p: DashPrefs) {
  if (typeof window !== 'undefined') localStorage.setItem('dashPrefs', JSON.stringify(p))
}

export const spanClass = (span: number) => (span === 3 ? 'lg:col-span-3' : span === 2 ? 'lg:col-span-2' : 'lg:col-span-1')
