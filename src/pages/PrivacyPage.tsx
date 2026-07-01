import { Cookie, Database, ShieldCheck } from 'lucide-react'

const privacySections = [
  {
    icon: ShieldCheck,
    title: 'Datos que recopilamos',
    text: 'Cuando realizas un pedido podemos solicitar nombre, WhatsApp, ciudad, dirección de entrega y detalle de compra para atender y coordinar tu solicitud.',
  },
  {
    icon: Database,
    title: 'Cómo usamos la información',
    text: 'Usamos tus datos para procesar pedidos, coordinar pagos y entregas, responder consultas y mantener un historial operativo. No vendemos información personal.',
  },
  {
    icon: Cookie,
    title: 'Cookies y almacenamiento local',
    text: 'El sitio conserva carrito, preferencias y consentimiento en tu navegador. Las herramientas opcionales de medición deberán respetar la elección registrada en el banner.',
  },
]

export function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream px-5 pb-24 pt-32 md:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="font-body text-xs font-semibold uppercase tracking-widest text-sage-dark">
          Información legal
        </p>
        <h1 className="mt-3 font-display text-5xl leading-tight text-ink">
          Privacidad y cookies
        </h1>
        <p className="mt-5 max-w-2xl font-body text-sm font-light leading-7 text-ink-muted">
          Esta política explica de forma clara qué información utiliza Auralith
          para atender pedidos y cómo puedes ejercer control sobre ella.
        </p>

        <div className="mt-12 grid gap-5">
          {privacySections.map((section) => {
            const Icon = section.icon

            return (
              <section
                className="border-b border-gold/20 py-6 md:grid md:grid-cols-[220px_1fr] md:gap-8"
                key={section.title}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-gold-dark" />
                  <h2 className="font-display text-2xl text-ink">{section.title}</h2>
                </div>
                <p className="mt-4 font-body text-sm font-light leading-7 text-ink-muted md:mt-0">
                  {section.text}
                </p>
              </section>
            )
          })}
        </div>

        <section className="mt-10 rounded-xl border border-sage/25 bg-sage/10 p-6">
          <h2 className="font-display text-2xl text-ink">Tus derechos</h2>
          <p className="mt-3 font-body text-sm font-light leading-7 text-ink-muted">
            Puedes solicitar acceso, corrección o eliminación de tus datos
            escribiendo al canal oficial de WhatsApp de Auralith. También puedes
            registrar una solicitud mediante el Libro de Reclamaciones.
          </p>
          <p className="mt-4 font-body text-xs text-ink-muted">
            Última actualización: 19 de junio de 2026.
          </p>
        </section>
      </div>
    </main>
  )
}
