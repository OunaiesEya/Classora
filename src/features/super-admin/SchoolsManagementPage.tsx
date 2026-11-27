
import { useEffect, useState } from 'react'
import {
  Building2,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  Ban,
  AlertCircle,
  Plus,
  X,
  Pencil,
} from 'lucide-react'

import supabase from '@/lib/supabase'
import { PageWrapper } from '@/components/layout/Layout'

interface School {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  address: string | null
  status: 'trial' | 'active' | 'suspended'
  created_at: string
}

const initialForm = {
  name: '',
  slug: '',
  email: '',
  phone: '',
  address: '',
  adminUserId: '',
}

export default function SchoolsManagementPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(initialForm)

  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  async function loadSchools() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('schools')
      .select('id, name, slug, email, phone, address, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement écoles :', error)
      setError('Impossible de charger les écoles. Vérifiez les autorisations Supabase.')
      setSchools([])
    } else {
      setSchools((data ?? []) as School[])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadSchools()
  }, [])

  function handleNameChange(value: string) {
    const slug = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    setForm(previous => ({ ...previous, name: value, slug }))
  }

  function openEditForm(school: School) {
    setEditingSchool(school)
    setForm({
      name: school.name,
      slug: school.slug,
      email: school.email ?? '',
      phone: school.phone ?? '',
      address: school.address ?? '',
      adminUserId: '',
    })
    setShowForm(false)
    setError('')
    setSuccess('')
  }

  function closeForms() {
    setShowForm(false)
    setEditingSchool(null)
    setForm(initialForm)
  }

  async function createSchool(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name.trim() || !form.slug.trim() || !form.adminUserId.trim()) {
      setError('Le nom, le slug et l’UUID de l’administrateur sont obligatoires.')
      return
    }

    setCreating(true)

    const { error } = await supabase.rpc('create_school_for_super_admin', {
      p_name: form.name.trim(),
      p_slug: form.slug.trim(),
      p_admin_user_id: form.adminUserId.trim(),
      p_plan_id: null,
      p_email: form.email.trim() || null,
      p_phone: form.phone.trim() || null,
      p_address: form.address.trim() || null,
    })

    if (error) {
      setError(`Impossible de créer l’école : ${error.message}`)
      setCreating(false)
      return
    }

    setSuccess('L’école a été créée avec succès.')
    closeForms()
    setCreating(false)
    await loadSchools()
  }

  async function updateSchool(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!editingSchool) return

    setError('')
    setSuccess('')
    setSavingEdit(true)

    const { error } = await supabase.rpc('update_school_for_super_admin', {
      p_school_id: editingSchool.id,
      p_name: form.name.trim(),
      p_slug: form.slug.trim(),
      p_email: form.email.trim() || null,
      p_phone: form.phone.trim() || null,
      p_address: form.address.trim() || null,
    })

    if (error) {
      console.error('Erreur modification école :', error)
      setError(`Impossible de modifier l’école : ${error.message}`)
      setSavingEdit(false)
      return
    }

    setSuccess('Les informations de l’école ont été modifiées avec succès.')
    closeForms()
    setSavingEdit(false)
    await loadSchools()
  }

  async function changeSchoolStatus(
    schoolId: string,
    newStatus: 'trial' | 'active' | 'suspended'
  ) {
    setUpdatingId(schoolId)
    setError('')
    setSuccess('')

    const { error } = await supabase.rpc('set_school_status', {
      p_school_id: schoolId,
      p_status: newStatus,
    })

    if (error) {
      setError(error.message)
      setUpdatingId(null)
      return
    }

    setSuccess('Le statut de l’école a été modifié.')
    await loadSchools()
    setUpdatingId(null)
  }

  const filteredSchools = schools.filter(school => {
    const searchText = search.toLowerCase()
    return (
      school.name.toLowerCase().includes(searchText) ||
      school.slug.toLowerCase().includes(searchText) ||
      (school.email ?? '').toLowerCase().includes(searchText)
    )
  })

  function statusLabel(status: School['status']) {
    if (status === 'active') return 'Active'
    if (status === 'trial') return 'Période d’essai'
    return 'Suspendue'
  }

  function statusStyle(status: School['status']) {
    if (status === 'active') return 'bg-green-100 text-green-700'
    if (status === 'trial') return 'bg-orange-100 text-orange-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <PageWrapper
      title="Gestion des écoles"
      subtitle="Consultez et gérez les établissements de Classora."
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              closeForms()
              setShowForm(true)
              setError('')
              setSuccess('')
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Ajouter une école
          </button>

          <button
            onClick={() => void loadSchools()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      }
    >
      <div className="space-y-6">

        {(showForm || editingSchool) && (
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">
                  {editingSchool ? 'Modifier une école' : 'Ajouter un établissement'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {editingSchool
                    ? 'Modifiez les coordonnées de cet établissement.'
                    : 'Renseignez les informations de la nouvelle école.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForms}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={editingSchool ? updateSchool : createSchool}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Nom de l'école *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => {
                      if (editingSchool) {
                        setForm(previous => ({ ...previous, name: e.target.value }))
                      } else {
                        handleNameChange(e.target.value)
                      }
                    }}
                    placeholder="Ex : École Internationale"
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Identifiant (slug) *</label>
                  <input
                    required
                    value={form.slug}
                    onChange={e => setForm(previous => ({ ...previous, slug: e.target.value }))}
                    placeholder="ecole-internationale"
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(previous => ({ ...previous, email: e.target.value }))}
                    placeholder="contact@ecole.tn"
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Téléphone</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(previous => ({ ...previous, phone: e.target.value }))}
                    placeholder="+216 ..."
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Adresse</label>
                  <input
                    value={form.address}
                    onChange={e => setForm(previous => ({ ...previous, address: e.target.value }))}
                    placeholder="Adresse de l'établissement"
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {!editingSchool && (
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">UUID de l'administrateur *</label>
                    <input
                      required
                      value={form.adminUserId}
                      onChange={e => setForm(previous => ({ ...previous, adminUserId: e.target.value }))}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      L'utilisateur doit déjà exister dans Supabase Auth et dans profiles.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeForms}
                  disabled={creating || savingEdit}
                  className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={creating || savingEdit}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingSchool
                    ? savingEdit ? 'Enregistrement...' : 'Enregistrer les modifications'
                    : creating ? 'Création en cours...' : 'Créer l’école'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5">
            <div className="flex items-center gap-3 text-gray-500">
              <Building2 size={20} />
              <span className="text-sm">Total des écoles</span>
            </div>
            <p className="mt-3 text-3xl font-bold">{schools.length}</p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle size={20} />
              <span className="text-sm">Écoles actives</span>
            </div>
            <p className="mt-3 text-3xl font-bold">
              {schools.filter(school => school.status === 'active').length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="flex items-center gap-3 text-orange-600">
              <Clock size={20} />
              <span className="text-sm">En période d’essai</span>
            </div>
            <p className="mt-3 text-3xl font-bold">
              {schools.filter(school => school.status === 'trial').length}
            </p>
          </div>
        </div>

        {/* Recherche */}
        <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une école par nom, identifiant ou e-mail..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        {/* Tableau */}
        <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <div className="border-b p-5">
            <h2 className="font-semibold text-gray-800">Tous les établissements</h2>
            <p className="mt-1 text-sm text-gray-500">
              {filteredSchools.length} établissement(s) trouvé(s).
            </p>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-gray-500">Chargement des écoles...</p>
          ) : filteredSchools.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">Aucune école trouvée.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Établissement</th>
                    <th className="px-5 py-3 font-medium">Identifiant</th>
                    <th className="px-5 py-3 font-medium">Contact</th>
                    <th className="px-5 py-3 font-medium">Statut</th>
                    <th className="px-5 py-3 font-medium">Création</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSchools.map(school => (
                    <tr key={school.id} className="border-t border-gray-100">
                      <td className="px-5 py-4 font-medium text-gray-800">{school.name}</td>
                      <td className="px-5 py-4 text-gray-500">{school.slug}</td>
                      <td className="px-5 py-4 text-gray-500">
                        {school.email || school.phone || 'Non renseigné'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle(school.status)}`}>
                          {statusLabel(school.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(school.created_at).toLocaleDateString('fr-TN')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openEditForm(school)}
                            className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            <Pencil size={13} />
                            Modifier
                          </button>

                          {school.status !== 'active' && (
                            <button
                              onClick={() => void changeSchoolStatus(school.id, 'active')}
                              disabled={updatingId === school.id}
                              className="rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                            >
                              Activer
                            </button>
                          )}

                          {school.status !== 'trial' && (
                            <button
                              onClick={() => void changeSchoolStatus(school.id, 'trial')}
                              disabled={updatingId === school.id}
                              className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                            >
                              Essai
                            </button>
                          )}

                          {school.status !== 'suspended' && (
                            <button
                              onClick={() => void changeSchoolStatus(school.id, 'suspended')}
                              disabled={updatingId === school.id}
                              className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              <Ban size={13} />
                              Suspendre
                            </button>
                          )}

                          {updatingId === school.id && (
                            <span className="text-xs text-gray-500">Mise à jour...</span>
                          )}
                        </div>
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
