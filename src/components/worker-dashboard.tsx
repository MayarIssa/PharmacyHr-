'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useLanguage } from '@/lib/i18n/language-provider'
import { Reveal } from '@/components/reveal'
import {
  Plane, Timer, HandCoins, UserX, CalendarClock, AlarmClock, MessageSquare, Newspaper,
  Clock, CheckCircle2, CalendarDays, DollarSign, AlertTriangle, User, ArrowUpRight,
} from 'lucide-react'
import type { TranslationKey } from '@/lib/i18n/translations'

const REQ_TABLES = ['holidays', 'overtime_requests', 'borrow_requests', 'resignations', 'appointments', 'forgotten_hours'] as const

const quick: { key: TranslationKey; href: string; icon: React.ReactNode; color: string }[] = [
  { key: 'holidays', href: '/orders/holidays', icon: <Plane size={18} />, color: 'bg-sky-500' },
  { key: 'overtime', href: '/orders/overtime', icon: <Timer size={18} />, color: 'bg-orange-500' },
  { key: 'borrows', href: '/orders/borrows', icon: <HandCoins size={18} />, color: 'bg-lime-600' },
  { key: 'appointments', href: '/orders/appointments', icon: <CalendarClock size={18} />, color: 'bg-cyan-500' },
  { key: 'forgottenHours', href: '/orders/forgotten-hours', icon: <AlarmClock size={18} />, color: 'bg-indigo-500' },
  { key: 'resignations', href: '/orders/resignations', icon: <UserX size={18} />, color: 'bg-rose-500' },
  { key: 'complaints', href: '/complaints', icon: <MessageSquare size={18} />, color: 'bg-red-500' },
  { key: 'mySchedule', href: '/schedules', icon: <CalendarDays size={18} />, color: 'bg-purple-500' },
]

interface Shift { day_of_week: number; start_time: string | null; end_time: string | null; is_off: boolean }
interface NewsItem { id: number; title: string; created_at: string }
interface MyReq { id: number; type: TranslationKey; status: string; date: string }

export function WorkerDashboard() {
  const { profile } = useAuthStore()
  const { t, tm } = useLanguage()
  const supabase = createClient()
  const [pending, setPending] = useState(0)
  const [approved, setApproved] = useState(0)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [recent, setRecent] = useState<MyReq[]>([])
  const [salary, setSalary] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const linked = !!profile?.employee_id
  const typeOf: Record<string, TranslationKey> = {
    holidays: 'holidays', overtime_requests: 'overtime', borrow_requests: 'borrows',
    resignations: 'resignations', appointments: 'appointments', forgotten_hours: 'forgottenHours',
  }

  useEffect(() => {
    const run = async () => {
      if (!linked) { setLoading(false); return }
      // Own requests across all tables (RLS scopes to own rows automatically)
      const reqs = await Promise.all(
        REQ_TABLES.map((tbl) => supabase.from(tbl).select('id, status, created_at').order('created_at', { ascending: false }).limit(20))
      )
      let p = 0, a = 0
      const all: MyReq[] = []
      reqs.forEach((res, i) => {
        const tbl = REQ_TABLES[i]
        ;(res.data || []).forEach((r: { id: number; status: string; created_at: string }) => {
          if (r.status === 'pending') p++
          if (r.status === 'approved') a++
          all.push({ id: r.id, type: typeOf[tbl], status: r.status, date: r.created_at })
        })
      })
      setPending(p); setApproved(a)
      setRecent(all.sort((x, y) => (x.date < y.date ? 1 : -1)).slice(0, 6))

      const [{ data: sc }, { data: nw }, { data: pay }] = await Promise.all([
        supabase.from('schedules').select('day_of_week, start_time, end_time, is_off').order('day_of_week'),
        supabase.from('news').select('id, title, created_at').order('created_at', { ascending: false }).limit(4),
        supabase.from('monthly_payroll').select('net_salary').order('year', { ascending: false }).order('month', { ascending: false }).limit(1),
      ])
      setShifts((sc as unknown as Shift[]) || [])
      setNews((nw as unknown as NewsItem[]) || [])
      setSalary(pay && pay[0] ? (pay[0] as { net_salary: number }).net_salary : null)
      setLoading(false)
    }
    run().catch(() => setLoading(false))
  }, [linked]) // eslint-disable-line react-hooks/exhaustive-deps

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('goodMorning') : hour < 18 ? t('goodAfternoon') : t('goodEvening')
  const days = tm('days')
  const shiftFor = (d: number) => shifts.find((s) => s.day_of_week === d)
  const statusColor = (s: string) => s === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : s === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  const statusLabel = (s: string) => s === 'pending' ? t('pending') : s === 'approved' ? t('approved') : t('rejected')

  const workDays = shifts.filter((s) => !s.is_off).length

  return (
    <div className="space-y-6">
      {/* Banner */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-xl shadow-emerald-600/20">
          <div className="absolute -top-8 -end-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -start-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
              <User size={26} />
            </div>
            <div>
              <p className="text-white/80 text-sm">{greeting}</p>
              <h1 className="text-2xl sm:text-3xl font-bold">{profile?.full_name}</h1>
              <p className="text-white/80 text-sm mt-0.5">{t('workerHello')}</p>
            </div>
          </div>
        </div>
      </Reveal>

      {!linked && (
        <Reveal>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-5 flex items-start gap-3">
            <AlertTriangle size={22} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">{t('noEmployeeLink')}</p>
          </div>
        </Reveal>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('pendingCount'), value: pending, icon: <Clock size={20} />, bg: 'bg-amber-50 dark:bg-amber-950/20', fg: 'text-amber-600 dark:text-amber-400', chip: 'bg-amber-500' },
          { label: t('approvedCount'), value: approved, icon: <CheckCircle2 size={20} />, bg: 'bg-emerald-50 dark:bg-emerald-950/20', fg: 'text-emerald-600 dark:text-emerald-400', chip: 'bg-emerald-500' },
          { label: t('thisWeek'), value: workDays, icon: <CalendarDays size={20} />, bg: 'bg-sky-50 dark:bg-sky-950/20', fg: 'text-sky-600 dark:text-sky-400', chip: 'bg-sky-500' },
          { label: t('myPayslips'), value: salary != null ? salary.toLocaleString() : '—', icon: <DollarSign size={20} />, bg: 'bg-violet-50 dark:bg-violet-950/20', fg: 'text-violet-600 dark:text-violet-400', chip: 'bg-violet-500' },
        ].map((c, i) => (
          <Reveal key={c.label} delay={i * 60}>
            <div className={`${c.bg} rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800`}>
              <div className={`w-10 h-10 rounded-xl ${c.chip} text-white flex items-center justify-center mb-3 shadow-lg`}>{c.icon}</div>
              <p className={`text-2xl font-bold ${c.fg}`}>{loading ? '…' : c.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Quick requests */}
      <Reveal>
        <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">{t('quickRequests')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quick.map((q) => (
              <Link key={q.href} href={q.href} className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <div className={`w-10 h-10 rounded-xl ${q.color} text-white flex items-center justify-center shadow group-hover:scale-110 transition-transform`}>{q.icon}</div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 text-center">{t(q.key)}</span>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My schedule */}
        <Reveal className="lg:col-span-2">
          <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 dark:text-white">{t('mySchedule')}</h2>
              <Link href="/schedules" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">{t('mySchedule')} <ArrowUpRight size={13} /></Link>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((d: string, i: number) => {
                const s = shiftFor(i)
                const off = !s || s.is_off
                return (
                  <div key={i} className={`rounded-xl p-2 text-center border ${off ? 'border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20' : 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20'}`}>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 truncate">{d}</p>
                    {off ? (
                      <p className="text-[10px] text-slate-400">{t('dayOff')}</p>
                    ) : (
                      <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 leading-tight" dir="ltr">{s!.start_time?.slice(0, 5)}<br />{s!.end_time?.slice(0, 5)}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </Reveal>

        {/* Latest news */}
        <Reveal>
          <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper size={18} className="text-pink-500" />
              <h2 className="font-semibold text-slate-900 dark:text-white">{t('latestNews')}</h2>
            </div>
            <div className="space-y-3">
              {news.length === 0 ? (
                <p className="text-sm text-slate-400">{t('noData')}</p>
              ) : news.map((n) => (
                <Link key={n.id} href="/news" className="block group">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 line-clamp-2">{n.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* Recent requests */}
      <Reveal>
        <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">{t('myRequests')}</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400">{t('noData')}</p>
          ) : (
            <div className="space-y-2">
              {recent.map((r) => (
                <div key={`${r.type}-${r.id}`} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t(r.type)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{new Date(r.date).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColor(r.status)}`}>{statusLabel(r.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  )
}
