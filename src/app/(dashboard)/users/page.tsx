'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useLanguage } from '@/lib/i18n/language-provider'
import { ShieldCheck, User, Shield, Power, Check, Clock, Link2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProfileRow { id: string; username: string; full_name: string; role: string; is_active: boolean; employee_id: number | null }
interface EmpRow { id: number; full_name: string }

export default function UsersPage() {
  const { profile } = useAuthStore()
  const { t } = useLanguage()
  const [rows, setRows] = useState<ProfileRow[]>([])
  const [employees, setEmployees] = useState<EmpRow[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const isAdmin = profile?.role === 'admin'

  const fetchRows = async () => {
    const { data } = await supabase.from('profiles').select('id, username, full_name, role, is_active, employee_id')
    const list = (data as unknown as ProfileRow[]) || []
    // pending first, then by name
    list.sort((a, b) => (a.is_active === b.is_active ? a.full_name.localeCompare(b.full_name) : a.is_active ? 1 : -1))
    setRows(list)
    setLoading(false)
  }
  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('id, full_name').order('full_name')
    setEmployees((data as unknown as EmpRow[]) || [])
  }

  useEffect(() => { if (isAdmin) { fetchRows(); fetchEmployees() } else setLoading(false) }, [isAdmin])

  const setRole = async (id: string, role: 'admin' | 'hr' | 'employee') => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t('roleUpdated')); fetchRows()
  }
  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_active: !current }).eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(current ? t('roleUpdated') : t('approveAccount')); fetchRows()
  }
  const linkEmployee = async (id: string, employeeId: number | null) => {
    const { error } = await supabase.from('profiles').update({ employee_id: employeeId }).eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t('roleUpdated')); fetchRows()
  }

  if (!isAdmin) {
    return (
      <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
        <Shield size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-slate-500 dark:text-slate-400">{t('admin')} only</p>
      </div>
    )
  }

  const roleBadge = (role: string) =>
    role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      : role === 'hr' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
  const roleLabel = (role: string) => role === 'admin' ? t('admin') : role === 'hr' ? t('hr') : t('worker')
  const pending = rows.filter((r) => !r.is_active)
  const selectCls = 'px-2 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white shadow-lg"><ShieldCheck size={20} /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('manageUsers')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('usersDesc')}</p>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 flex items-center gap-3">
          <Clock size={20} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300"><b>{pending.length}</b> {t('pendingRequests')}</p>
        </div>
      )}

      <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('fullName')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('email')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('role')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('linkEmployee')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('status')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('loading')}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('noData')}</td></tr>
              ) : rows.map((r) => {
                const isWorker = r.role === 'employee'
                const needsLink = isWorker && !r.employee_id
                return (
                <tr key={r.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${!r.is_active ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold">{r.full_name?.charAt(0) || <User size={14} />}</div>
                      <span className="font-medium text-slate-900 dark:text-white">{r.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.username}</td>
                  <td className="px-4 py-3">
                    <select value={r.role} onChange={(e) => setRole(r.id, e.target.value as 'admin' | 'hr' | 'employee')} className={`${selectCls} ${roleBadge(r.role)}`} title={roleLabel(r.role)}>
                      <option value="admin">{t('admin')}</option>
                      <option value="hr">{t('hr')}</option>
                      <option value="employee">{t('worker')}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {isWorker ? (
                      <div className="flex items-center gap-1.5">
                        <Link2 size={14} className={needsLink ? 'text-amber-500' : 'text-emerald-500'} />
                        <select value={r.employee_id ?? ''} onChange={(e) => linkEmployee(r.id, e.target.value ? Number(e.target.value) : null)} className={`${selectCls} ${needsLink ? 'ring-1 ring-amber-400' : ''}`}>
                          <option value="">{t('selectEmployee')}</option>
                          {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${r.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {r.is_active ? t('active') : t('pending')}
                    </span>
                    {needsLink && r.is_active && (
                      <span className="mt-1 flex items-center gap-1 text-[10px] text-amber-500"><AlertTriangle size={11} /> {t('notLinked')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {!r.is_active && (
                        <button onClick={() => toggleActive(r.id, r.is_active)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition flex items-center gap-1"><Check size={13} /> {t('approveAccount')}</button>
                      )}
                      {r.is_active && (
                        <button onClick={() => toggleActive(r.id, r.is_active)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition flex items-center gap-1"><Power size={12} /> {t('deactivate')}</button>
                      )}
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
