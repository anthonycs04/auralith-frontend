import { motion } from 'framer-motion'
import { GripVertical, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAdminStore, type AdminContent } from '../../store'
import { cn } from '../../components/ui/utils'

function AdminField({
  label,
  onChange,
  textarea = false,
  value,
}: {
  label: string
  onChange: (value: string) => void
  textarea?: boolean
  value: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
        {label}
      </span>
      {textarea ? (
        <textarea
          className="min-h-28 w-full resize-none rounded-xl border border-white/10 bg-[#191919] px-4 py-3 font-body text-sm text-cream outline-none transition-colors focus:border-gold"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      ) : (
        <input
          className="h-11 w-full rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none transition-colors focus:border-gold"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      )}
    </label>
  )
}

export function AdminContentPage() {
  const savedContent = useAdminStore((state) => state.content)
  const updateContent = useAdminStore((state) => state.updateContent)
  const addToast = useAdminStore((state) => state.addToast)
  const [content, setContent] = useState<AdminContent>(savedContent)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setContent(savedContent))

    return () => window.cancelAnimationFrame(frame)
  }, [savedContent])

  const patchContent = <Key extends keyof AdminContent>(
    key: Key,
    value: AdminContent[Key],
  ) => {
    setContent((current) => ({ ...current, [key]: value }))
  }

  const patchFaq = (
    id: string,
    key: 'answer' | 'question',
    value: string,
  ) => {
    patchContent(
      'faqs',
      content.faqs.map((faq) => (faq.id === id ? { ...faq, [key]: value } : faq)),
    )
  }

  const patchTestimonial = (
    id: string,
    key: 'author' | 'quote',
    value: string,
  ) => {
    patchContent(
      'testimonials',
      (content.testimonials ?? []).map((testimonial) =>
        testimonial.id === id ? { ...testimonial, [key]: value } : testimonial,
      ),
    )
  }

  const reorderFaq = (fromIndex: number, toIndex: number) => {
    const nextFaqs = [...content.faqs]
    const [moved] = nextFaqs.splice(fromIndex, 1)

    if (!moved) {
      return
    }

    nextFaqs.splice(toIndex, 0, moved)
    patchContent('faqs', nextFaqs)
  }

  const reorderTestimonial = (fromIndex: number, toIndex: number) => {
    const nextTestimonials = [...(content.testimonials ?? [])]
    const [moved] = nextTestimonials.splice(fromIndex, 1)

    if (!moved) {
      return
    }

    nextTestimonials.splice(toIndex, 0, moved)
    patchContent('testimonials', nextTestimonials)
  }

  const saveContent = async () => {
    setIsSaving(true)
    try {
      await updateContent(content)
      addToast({
        message: 'Los textos públicos se actualizaron correctamente.',
        title: 'Contenido guardado',
        variant: 'success',
      })
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'No se pudo guardar.',
        title: 'Error al guardar',
        variant: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
            Sitio público
          </p>
          <h1 className="mt-2 font-display text-4xl text-cream">Contenido</h1>
        </div>
        <motion.button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-gold bg-gold px-5 font-body text-sm font-semibold text-ink transition-colors hover:bg-gold-light disabled:opacity-60"
          disabled={isSaving}
          onClick={saveContent}
          type="button"
          whileTap={{ scale: 0.97 }}
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </motion.button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-6">
          <div className="rounded-xl border border-white/5 bg-[#242424] p-5">
            <h2 className="font-display text-2xl text-cream">Hero</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <AdminField
                  label="Texto hero"
                  onChange={(value) => patchContent('heroText', value)}
                  textarea
                  value={content.heroText}
                />
              </div>
              <AdminField
                label="Botón primario"
                onChange={(value) => patchContent('heroPrimaryButton', value)}
                value={content.heroPrimaryButton}
              />
              <AdminField
                label="Botón secundario"
                onChange={(value) => patchContent('heroSecondaryButton', value)}
                value={content.heroSecondaryButton}
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#242424] p-5">
            <h2 className="font-display text-2xl text-cream">Datos de contacto</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <AdminField
                label="WhatsApp"
                onChange={(value) => patchContent('whatsappNumber', value)}
                value={content.whatsappNumber}
              />
              <AdminField
                label="Instagram"
                onChange={(value) => patchContent('instagramHandle', value)}
                value={content.instagramHandle}
              />
              <AdminField
                label="Horario"
                onChange={(value) => patchContent('schedule', value)}
                value={content.schedule}
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#242424] p-5">
            <h2 className="font-display text-2xl text-cream">Sobre Auralith</h2>
            <div className="mt-5">
              <AdminField
                label="Texto sobre nosotros"
                onChange={(value) => patchContent('storyText', value)}
                textarea
                value={content.storyText}
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#242424] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-cream">Testimonios</h2>
                <p className="mt-1 font-body text-xs text-cream-dark/50">
                  Estos textos se muestran en la pagina principal.
                </p>
              </div>
              <button
                className="grid h-9 w-9 place-items-center rounded-full border border-gold/35 text-gold transition-colors hover:bg-gold/10"
                onClick={() =>
                  patchContent('testimonials', [
                    ...(content.testimonials ?? []),
                    {
                      author: '',
                      id: `testimonial-${Date.now()}`,
                      quote: '',
                    },
                  ])
                }
                type="button"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {(content.testimonials ?? []).map((testimonial, index) => (
                <div
                  className="rounded-xl border border-white/10 bg-[#191919] p-4"
                  draggable
                  key={testimonial.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={(event) =>
                    event.dataTransfer.setData('text/plain', index.toString())
                  }
                  onDrop={(event) => {
                    event.preventDefault()
                    reorderTestimonial(
                      Number(event.dataTransfer.getData('text/plain')),
                      index,
                    )
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-widest text-cream-dark/45">
                      <GripVertical className="h-4 w-4" />
                      Testimonio {index + 1}
                    </span>
                    <button
                      className="grid h-8 w-8 place-items-center rounded-full text-cream-dark/60 transition-colors hover:bg-red-500/10 hover:text-red-300"
                      onClick={() =>
                        patchContent(
                          'testimonials',
                          (content.testimonials ?? []).filter(
                            (item) => item.id !== testimonial.id,
                          ),
                        )
                      }
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <AdminField
                      label="Nombre"
                      onChange={(value) =>
                        patchTestimonial(testimonial.id, 'author', value)
                      }
                      value={testimonial.author}
                    />
                    <AdminField
                      label="Testimonio"
                      onChange={(value) =>
                        patchTestimonial(testimonial.id, 'quote', value)
                      }
                      textarea
                      value={testimonial.quote}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="rounded-xl border border-white/5 bg-[#242424] p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl text-cream">FAQs</h2>
            <button
              className="grid h-9 w-9 place-items-center rounded-full border border-gold/35 text-gold transition-colors hover:bg-gold/10"
              onClick={() =>
                patchContent('faqs', [
                  ...content.faqs,
                  {
                    answer: '',
                    id: window.crypto.randomUUID(),
                    question: '',
                  },
                ])
              }
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {content.faqs.map((faq, index) => (
              <div
                className="rounded-xl border border-white/10 bg-[#191919] p-4"
                draggable
                key={faq.id}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={(event) =>
                  event.dataTransfer.setData('text/plain', index.toString())
                }
                onDrop={(event) => {
                  event.preventDefault()
                  reorderFaq(Number(event.dataTransfer.getData('text/plain')), index)
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-widest text-cream-dark/45">
                    <GripVertical className="h-4 w-4" />
                    FAQ {index + 1}
                  </span>
                  <button
                    className={cn(
                      'grid h-8 w-8 place-items-center rounded-full text-cream-dark/60 transition-colors hover:bg-red-500/10 hover:text-red-300',
                    )}
                    onClick={() =>
                      patchContent(
                        'faqs',
                        content.faqs.filter((item) => item.id !== faq.id),
                      )
                    }
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <AdminField
                    label="Pregunta"
                    onChange={(value) => patchFaq(faq.id, 'question', value)}
                    value={faq.question}
                  />
                  <AdminField
                    label="Respuesta"
                    onChange={(value) => patchFaq(faq.id, 'answer', value)}
                    textarea
                    value={faq.answer}
                  />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
