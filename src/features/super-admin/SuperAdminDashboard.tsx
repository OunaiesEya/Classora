
import { useEffect, useState } from 'react'
import {
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import supabase from '@/lib/supabase'
import { PageWrapper } from '@/components/layout/Layout'

interface School {
  id: string
  name: string
  slug: string
  status: string
  created_at: string
}

interface DashboardStats {
  schools: number
  activeSchools: number
  trialSchools: number
  subscriptions: number
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    schools: 0,
    activeSchools: 0,
    trialSchools: 0,
    subscriptions: 0,
  })

  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboard() {
    setLoading(true)
    setError('')

    try {
      const [
        schoolsResult,
        activeResult,
        trialResult,
        subscriptionsResult,
        latestSchoolsResult,
      ] = await Promise.all([
        supabase.from('schools').select('*', { count: 'exact', head: true }),
        supabase.from('schools').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('schools').select('*', { count: 'exact', head: true }).eq('status', 'trial'),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }),
        supabase
          .from('schools')
          .select('id, name, slug, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const results = [
        schoolsResult,
        activeResult,
        trialResult,
        subscriptionsResult,
        latestSchoolsResult,
      ]

      const failed = results.find(result => result.error)

      if (failed?.error) throw failed.error

      setStats({
        schools: schoolsResult.count ?? 0,
        activeSchools: activeResult.count ?? 0,
        trialSchools: trialResult.count ?? 0,
        subscriptions: subscriptionsResult.count ?? 0,
      })

      setSchools(latestSchoolsResult.data ?? [])
    } catch (err) {
      console.error('Erreur dashboard Super Admin :', err)
      setError('Impossible de charger les statistiques. Vérifiez les autorisations Supabase.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  const cards = [
    {
      title: 'Total des écoles',
      value: stats.schools,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Écoles actives',
      value: stats.activeSchools,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Périodes d’essai',
      value: stats.trialSchools,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Abonnements',
      value: stats.subscriptions,
      icon: CreditCard,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <PageWrapper
      title="Administration Classora"
      subtitle="Vue globale de la plateforme"
      actions={
        <button
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Tableau de bord global
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Suivez les établissements et les abonnements de Classora.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(card => {
            const Icon = card.icon

            return (
              <div
                key={card.title}
                className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <div className={`rounded-xl p-3 ${card.bg}`}>
                    <Icon size={21} className={card.color} />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-bold text-gray-800">
                  {loading ? '—' : card.value}
                </p>
              </div>
            )
          })}
        </div>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white">
          <div className="border-b border-[var(--color-border)] p-5">
            <h3 className="font-semibold text-gray-800">
              Derniers établissements inscrits
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Les cinq écoles les plus récemment créées.
            </p>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-gray-500">
              Chargement des établissements...
            </p>
          ) : schools.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              Aucun établissement trouvé.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Établissement</th>
                    <th className="px-5 py-3 font-medium">Identifiant</th>
                    <th className="px-5 py-3 font-medium">Statut</th>
                    <th className="px-5 py-3 font-medium">Date de création</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map(school => (
                    <tr key={school.id} className="border-t border-gray-100">
                      <td className="px-5 py-4 font-medium text-gray-800">
                        {school.name}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {school.slug}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          school.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : school.status === 'trial'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {school.status === 'active'
                            ? 'Active'
                            : school.status === 'trial'
                              ? 'Essai'
                              : 'Suspendue'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(school.created_at).toLocaleDateString('fr-TN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageWrapper>
  )
}
