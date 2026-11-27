
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import supabase from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setSessionReady(!!session)
      })

    supabase.auth.getSession().then(({ data, error }) => {
      if (!error && data.session) {
        setSessionReady(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 6) {
      toast({
        type: 'error',
        title: 'Mot de passe trop court',
        message: 'Utilise au moins 6 caractères.',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        type: 'error',
        title: 'Mots de passe différents',
        message: 'Les deux mots de passe ne correspondent pas.',
      })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      toast({
        type: 'error',
        title: 'Erreur',
        message: error.message,
      })
      return
    }

    toast({
      type: 'success',
      title: 'Mot de passe créé',
      message: 'Ton mot de passe a été enregistré.',
    })

    navigate('/super-admin')
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">
            Lien invalide ou expiré
          </h1>
          <p className="text-sm text-gray-600 mb-5">
            Le lien de réinitialisation est invalide ou a expiré.
            Retourne à la connexion et demande un nouvel e-mail.
          </p>
          <Button onClick={() => navigate('/login')}>
            Retour à la connexion
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-ivory)] p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">
          Créer un nouveau mot de passe
        </h1>

        <p className="text-sm text-gray-600 mb-6">
          Choisis un mot de passe pour ton compte Super Admin Classora.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="new-password"
            label="Nouveau mot de passe"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            icon={<Lock size={14} />}
            required
            autoComplete="new-password"
          />

          <Input
            id="confirm-password"
            label="Confirmer le mot de passe"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            icon={<Lock size={14} />}
            required
            autoComplete="new-password"
          />

          <button
            type="button"
            onClick={() => setShowPassword(value => !value)}
            className="text-sm text-left text-[var(--color-forest)] flex items-center gap-2"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            {showPassword ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
          </button>

          <Button
            type="submit"
            loading={loading}
            size="lg"
            className="w-full"
          >
            Enregistrer mon mot de passe
          </Button>
        </form>
      </div>
    </div>
  )
}
