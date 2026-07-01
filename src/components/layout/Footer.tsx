import { Camera, MessageCircle, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-gold/15 bg-ink px-5 py-12 text-cream md:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <Link
            className="font-display text-2xl tracking-widest text-cream"
            to="/"
          >
            AURALITH
          </Link>
          <p className="mt-3 max-w-sm font-body text-sm font-light leading-relaxed text-cream-dark/65">
            Tienda holística peruana. Productos elegidos para acompañar rituales,
            intención y bienestar cotidiano.
          </p>
        </div>

        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
            Atención
          </p>
          <div className="mt-4 space-y-3 font-body text-sm text-cream-dark/70">
            <a
              className="flex items-center gap-2 hover:text-cream"
              href="https://wa.me/51999999999"
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              WhatsApp
            </a>
            <a
              className="flex items-center gap-2 hover:text-cream"
              href="https://instagram.com/auralith.pe"
              rel="noreferrer"
              target="_blank"
            >
              <Camera className="h-4 w-4 text-gold" />
              @auralith.pe
            </a>
          </div>
        </div>

        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
            Información legal
          </p>
          <div className="mt-4 space-y-3 font-body text-sm text-cream-dark/70">
            <Link
              className="flex items-center gap-2 hover:text-cream"
              to="/privacidad"
            >
              <ShieldCheck className="h-4 w-4 text-sage-light" />
              Privacidad y cookies
            </Link>
            <Link className="block hover:text-cream" to="/libro-de-reclamaciones">
              Libro de Reclamaciones
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-6 font-body text-xs text-cream-dark/45 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Auralith. Todos los derechos reservados.</p>
        <p>Perú</p>
      </div>
    </footer>
  )
}
