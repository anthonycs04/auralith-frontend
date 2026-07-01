import { AnimatePresence, motion } from 'framer-motion'
import { BookOpenCheck, CheckCircle2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { apiFetch } from '../lib/api'

type ComplaintForm = {
  address: string
  detail: string
  document: string
  email: string
  fullName: string
  orderCode: string
  phone: string
  request: string
  type: 'queja' | 'reclamo'
}

const initialForm: ComplaintForm = {
  address: '',
  detail: '',
  document: '',
  email: '',
  fullName: '',
  orderCode: '',
  phone: '',
  request: '',
  type: 'reclamo',
}

export function ComplaintsBookPage() {
  const [form, setForm] = useState(initialForm)
  const [accepted, setAccepted] = useState(false)
  const [submittedCode, setSubmittedCode] = useState('')
  const [submitError, setSubmitError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!accepted) {
      return
    }

    try {
      const complaint = await apiFetch<{ code: string }>('/complaints', {
        body: JSON.stringify(form),
        method: 'POST',
      })
      setSubmittedCode(complaint.code)
      setSubmitError('')
      setForm(initialForm)
      setAccepted(false)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'No se pudo registrar la solicitud.',
      )
    }
  }

  return (
    <main className="min-h-screen bg-cream px-5 pb-24 pt-32 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gold/15 text-gold-dark">
              <BookOpenCheck className="h-6 w-6" />
            </span>
            <p className="mt-6 font-body text-xs font-semibold uppercase tracking-widest text-sage-dark">
              Atención al consumidor
            </p>
            <h1 className="mt-3 font-display text-5xl leading-tight text-ink">
              Libro de Reclamaciones
            </h1>
            <p className="mt-5 font-body text-sm font-light leading-7 text-ink-muted">
              Registra aquí un reclamo sobre un producto o una queja sobre la
              atención recibida. Conservaremos la constancia para dar seguimiento.
            </p>
            <div className="mt-7 border-l-2 border-gold pl-4 font-body text-xs leading-6 text-ink-muted">
              Reclamo: disconformidad con un producto o servicio. Queja:
              disconformidad no relacionada directamente con el producto.
            </div>
          </div>

          <form
            className="rounded-xl border border-gold/20 bg-cream-light p-5 shadow-soft md:p-7"
            onSubmit={submit}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['fullName', 'Nombre completo', true],
                ['document', 'DNI / CE', true],
                ['email', 'Correo electrónico', true],
                ['phone', 'Teléfono', true],
                ['address', 'Dirección', true],
                ['orderCode', 'Código de pedido', false],
              ].map(([field, label, required]) => (
                <label className="block" key={field as string}>
                  <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-ink-muted">
                    {label as string}
                  </span>
                  <input
                    className="h-12 w-full rounded-lg border border-cream-dark bg-white/60 px-4 font-body text-sm text-ink outline-none focus:border-gold"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field as string]: event.target.value,
                      }))
                    }
                    required={required as boolean}
                    value={form[field as keyof ComplaintForm]}
                  />
                </label>
              ))}
            </div>

            <fieldset className="mt-5">
              <legend className="font-body text-xs font-semibold uppercase tracking-widest text-ink-muted">
                Tipo de solicitud
              </legend>
              <div className="mt-3 flex gap-3">
                {(['reclamo', 'queja'] as const).map((type) => (
                  <label
                    className={`flex h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border font-body text-sm capitalize ${
                      form.type === type
                        ? 'border-gold bg-gold/15 text-ink'
                        : 'border-cream-dark text-ink-muted'
                    }`}
                    key={type}
                  >
                    <input
                      checked={form.type === type}
                      className="sr-only"
                      name="complaint-type"
                      onChange={() => setForm((current) => ({ ...current, type }))}
                      type="radio"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </fieldset>

            {[
              ['detail', 'Detalle del reclamo o queja'],
              ['request', 'Pedido concreto del consumidor'],
            ].map(([field, label]) => (
              <label className="mt-5 block" key={field}>
                <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  {label}
                </span>
                <textarea
                  className="min-h-28 w-full resize-none rounded-lg border border-cream-dark bg-white/60 px-4 py-3 font-body text-sm text-ink outline-none focus:border-gold"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                  required
                  value={form[field as 'detail' | 'request']}
                />
              </label>
            ))}

            <label className="mt-5 flex cursor-pointer items-start gap-3">
              <input
                checked={accepted}
                className="mt-1 h-4 w-4 accent-gold"
                onChange={(event) => setAccepted(event.target.checked)}
                type="checkbox"
              />
              <span className="font-body text-xs leading-5 text-ink-muted">
                Declaro que la información registrada es correcta y acepto su
                tratamiento para atender esta solicitud.
              </span>
            </label>

            <button
              className="mt-6 h-12 w-full rounded-full bg-gold px-6 font-body text-sm font-semibold text-ink hover:bg-gold-light disabled:opacity-50"
              disabled={!accepted}
              type="submit"
            >
              Registrar solicitud
            </button>

            {submitError ? (
              <p className="mt-4 font-body text-xs text-red-600">{submitError}</p>
            ) : null}

            <AnimatePresence>
              {submittedCode ? (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 flex items-start gap-3 rounded-xl border border-sage/30 bg-sage/10 p-4"
                  initial={{ opacity: 0, y: 8 }}
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-sage-dark" />
                  <p className="font-body text-sm text-ink">
                    Solicitud registrada. Tu constancia es{' '}
                    <strong>{submittedCode}</strong>.
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </main>
  )
}
