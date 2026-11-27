
import { useEffect, useState } from 'react'
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  Pencil,
  X,
  Check,
} from 'lucide-react'

import supabase from '@/lib/supabase'
import { PageWrapper } from '@/components/layout/Layout'

interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  created_at: string
  school_name: string | null
}

const availableRoles = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'enseignant', label: 'Enseignant' },
  { value: 'parent', label: 'Parent' },
  { value: 'eleve', label: 'Élève' },
  { value: 'secretariat', label: 'Secrétariat' },
]

const getRoleLabel = (role: string | null) => {
  const roles: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrateur',
    enseignant: 'Enseignant',
    parent: 'Parent',
    eleve: 'Élève',
    secretariat: 'Secrétariat',
    user: 'Utilisateur',
  }

  return role ? roles[role] || role : 'Non défini'
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [savingRole, setSavingRole] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: authData } = await supabase.auth.getUser()
      setCurrentUserId(authData.user?.id ?? null)

      const { data, error } = await supabase.rpc(
        'get_all_users_for_super_admin'
      )

      if (error) throw error

      setUsers((data || []) as UserProfile[])
    } catch (err: any) {
      console.error('Erreur chargement utilisateurs:', err)
      setError(err.message || 'Impossible de charger les utilisateurs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const updateUserRole = async (userId: string) => {
    if (!selectedRole) return

    setSavingRole(true)
    setError('')

    try {
      const { error } = await supabase.rpc(
        'update_user_role_for_super_admin',
        {
          p_user_id: userId,
          p_role: selectedRole,
        }
      )

      if (error) throw error

      setEditingUserId(null)
      setSelectedRole('')
      await loadUsers()
    } catch (err: any) {
      console.error('Erreur modification rôle:', err)
      setError(err.message || 'Impossible de modifier le rôle.')
    } finally {
      setSavingRole(false)
    }
  }

  const startEditing = (user: UserProfile) => {
    setEditingUserId(user.id)
    setSelectedRole(user.role || 'parent')
    setError('')
  }

  const cancelEditing = () => {
    setEditingUserId(null)
    setSelectedRole('')
  }

  const filteredUsers = users.filter((user) => {
    const searchValue = search.toLowerCase()

    return (
      (user.full_name || '').toLowerCase().includes(searchValue) ||
      (user.email || '').toLowerCase().includes(searchValue) ||
      (user.school_name || '').toLowerCase().includes(searchValue) ||
      getRoleLabel(user.role).toLowerCase().includes(searchValue)
    )
  })

  const totalUsers = users.length
  const totalAdmins = users.filter((user) => user.role === 'admin').length
  const totalTeachers = users.filter(
    (user) => user.role === 'enseignant'
  ).length
  const totalParents = users.filter((user) => user.role === 'parent').length

  return (
    <PageWrapper title="Gestion des utilisateurs">
      <div className="space-y-6">

        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Gestion des utilisateurs
            </h2>
            <p className="text-gray-500 mt-1">
              Consultez et gérez les utilisateurs de toutes les écoles.
            </p>
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={loading ? 'animate-spin' : ''}
            />
            Actualiser
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Total utilisateurs</p>
              <Users className="text-blue-600" size={22} />
            </div>
            <p className="text-3xl font-bold mt-3">{totalUsers}</p>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">Administrateurs</p>
            <p className="text-3xl font-bold mt-3">{totalAdmins}</p>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">Enseignants</p>
            <p className="text-3xl font-bold mt-3">{totalTeachers}</p>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">Parents</p>
            <p className="text-3xl font-bold mt-3">{totalParents}</p>
          </div>
        </div>

        {/* Recherche */}
        <div className="bg-white rounded-xl border p-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email, rôle ou école..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Tableau */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-5 border-b">
            <h3 className="font-semibold text-gray-900">
              Liste des utilisateurs
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {filteredUsers.length} utilisateur(s) trouvé(s)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-4">Nom</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Rôle</th>
                  <th className="text-left p-4">École</th>
                  <th className="text-left p-4">Date d'inscription</th>
                  <th className="text-center p-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Chargement des utilisateurs...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isEditing = editingUserId === user.id
                    const isProtected =
                      user.id === currentUserId ||
                      user.role === 'super_admin'

                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-900">
                          {user.full_name || 'Nom non renseigné'}
                        </td>

                        <td className="p-4 text-gray-600">
                          {user.email || 'Email non renseigné'}
                        </td>

                        <td className="p-4">
                          {isEditing ? (
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="border rounded-lg px-3 py-2 bg-white"
                            >
                              {availableRoles.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                              {getRoleLabel(user.role)}
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-gray-600">
                          {user.school_name || 'Aucune école'}
                        </td>

                        <td className="p-4 text-gray-600 whitespace-nowrap">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString(
                                'fr-FR'
                              )
                            : 'Non disponible'}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => updateUserRole(user.id)}
                                  disabled={savingRole}
                                  title="Enregistrer"
                                  className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                                >
                                  <Check size={18} />
                                </button>

                                <button
                                  onClick={cancelEditing}
                                  disabled={savingRole}
                                  title="Annuler"
                                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEditing(user)}
                                disabled={isProtected}
                                title={
                                  isProtected
                                    ? 'Modification non autorisée'
                                    : 'Modifier le rôle'
                                }
                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Pencil size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
