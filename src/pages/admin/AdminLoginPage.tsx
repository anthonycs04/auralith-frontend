import { motion } from 'framer-motion'
import { Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuthStore } from '../../store'

export function AdminLoginPage() {
  const [email, setEmail] = useState('admin@auralith.pe')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const login = useAdminAuthStore((state) => state.login)
  const isLoading = useAdminAuthStore((state) => state.isLoading)
  const error = useAdminAuthStore((state) => state.error)
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (await login(email, password)) {
      navigate('/admin', { replace: true })
    }
  }

  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <div className="mb-8 max-w-3xl">
        <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
          Área oculta
        </p>
        <h1 className="mt-2 font-display text-4xl text-cream">Acceso interno</h1>
        <p className="mt-2 font-body text-sm leading-relaxed text-cream-dark/60">
          Acceso privado del equipo. La sesión se valida con Supabase Auth antes
          de cargar productos, pedidos, métricas y stock.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)]">
        <section className="rounded-xl border border-gold/20 bg-[#242424] p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gold/15 text-gold">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-3xl text-cream">Entrada privada</h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-cream-dark/65">
                El API verifica identidad, rol y vigencia de la sesión en cada
                operación administrativa.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {[
              'Autenticación real con sesión segura.',
              'Permisos administrativos verificados por el API.',
              'Catálogo, pedidos y stock conectados a Supabase.',
            ].map((item) => (
              <div
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#191919] px-4 py-3"
                key={item}
              >
                <ShieldCheck className="h-4 w-4 text-sage-light" />
                <p className="font-body text-sm text-cream-dark">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <motion.form
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/5 bg-cream p-6 text-ink shadow-lifted md:p-8"
          initial={{ opacity: 0, y: 18 }}
          onSubmit={handleSubmit}
          transition={{ damping: 24, stiffness: 240, type: 'spring' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold-dark">
                Acceso seguro
              </p>
              <h2 className="mt-3 font-display text-4xl text-ink">
                Ingresar al panel
              </h2>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gold/15 text-gold-dark">
              <KeyRound className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-ink-muted">
                Email
              </span>
              <span className="relative block">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <input
                  autoComplete="username"
                  className="h-12 w-full rounded-xl border border-cream-dark bg-cream-light pl-11 pr-4 font-body text-sm text-ink outline-none transition-colors focus:border-gold"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-ink-muted">
                Contraseña
              </span>
              <span className="relative block">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <input
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-cream-dark bg-cream-light pl-11 pr-12 font-body text-sm text-ink outline-none transition-colors focus:border-gold"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ink-muted transition-colors hover:bg-gold/10 hover:text-ink"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </span>
            </label>
          </div>

          {error ? (
            <motion.p
              animate={{ opacity: 1, x: [0, -4, 4, -4, 0] }}
              className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 font-body text-xs text-red-700"
              initial={{ opacity: 0 }}
            >
              {error}
            </motion.p>
          ) : null}

          <motion.button
            className="auralith-shimmer relative mt-6 flex h-12 w-full items-center justify-center overflow-hidden rounded-full border border-gold bg-gold px-6 font-body text-sm font-semibold text-ink shadow-gold transition-colors hover:bg-gold-light disabled:opacity-60"
            disabled={isLoading}
            type="submit"
            whileTap={{ scale: 0.97 }}
          >
            <span className="relative z-10">
              {isLoading ? 'Validando...' : 'Ingresar al panel'}
            </span>
          </motion.button>
        </motion.form>
      </div>
    </div>
  )
}
