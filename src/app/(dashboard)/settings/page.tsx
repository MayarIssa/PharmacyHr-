'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/language-provider'
import { WIDGETS, DEFAULT_ORDER, loadPrefs, savePrefs, type DashPrefs } from '@/lib/dashboard-prefs'
import { Settings, Eye, EyeOff, ChevronUp, ChevronDown, RotateCcw, LayoutDashboard, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { t } = useLanguage()
  const [prefs, setPrefs] = useState<DashPrefs>({ order: DEFAULT_ORDER, hidden: [] })
  const [ready, setReady] = useState(false)

  useEffect(() => { setPrefs(loadPrefs()); setReady(true) }, [])

  const commit = (next: DashPrefs) => { setPrefs(next); savePrefs(next); toast.success(t('savedPrefs')) }

  const toggleHide = (id: string) => {
    const hidden = prefs.hidden.includes(id) ? prefs.hidden.filter((x) => x !== id) : [...prefs.hidden, id]
    commit({ ...prefs, hidden })
  }
  const move = (id: string, dir: -1 | 1) => {
    const order = [...prefs.order]
    const i = order.indexOf(id)
    const j = i + dir
    if (j < 0 || j >= order.length) return
    ;[order[i], order[j]] = [order[j], order[i]]
    commit({ ...prefs, order })
  }
  const reset = () => commit({ order: DEFAULT_ORDER, hidden: [] })

  const meta = (id: string) => WIDGETS.find((w) => w.id === id)!
  const visibleCount = prefs.order.filter((id) => !prefs.hidden.includes(id)).length

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-white shadow-lg"><Settings size={20} /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('customizeDashboard')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('customizeDesc')}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/" className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 hover:shadow-lg transition flex items-center gap-2">
          <LayoutDashboard size={16} /> {t('dashboard')}
        </Link>
        <button onClick={reset} className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2">
          <RotateCcw size={15} /> {t('resetDefault')}
        </button>
        <span className="text-sm text-slate-500 dark:text-slate-400 ms-auto">{visibleCount} / {WIDGETS.length}</span>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {(ready ? prefs.order : DEFAULT_ORDER).map((id, i, arr) => {
          const w = meta(id)
          const hidden = prefs.hidden.includes(id)
          return (
            <div key={id} className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${hidden ? 'bg-slate-50/60 dark:bg-slate-800/20' : ''}`}>
              <GripVertical size={16} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">{i + 1}</div>
              <span className={`flex-1 text-sm font-medium ${hidden ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>{t(w.labelKey)}</span>

              <div className="flex items-center gap-1">
                <button onClick={() => move(id, -1)} disabled={i === 0} title={t('moveUp')} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition">
                  <ChevronUp size={16} />
                </button>
                <button onClick={() => move(id, 1)} disabled={i === arr.length - 1} title={t('moveDown')} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition">
                  <ChevronDown size={16} />
                </button>
                <button onClick={() => toggleHide(id)} title={hidden ? t('show') : t('hide')} className={`ms-1 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                  hidden
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                }`}>
                  {hidden ? <><EyeOff size={13} /> {t('hide')}</> : <><Eye size={13} /> {t('show')}</>}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
