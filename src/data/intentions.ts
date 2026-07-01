import type { Intention } from './types'

export const intentions: Intention[] = [
  {
    affirmation: 'Me trato con ternura, presencia y respeto.',
    benefits: ['Autoestima', 'Apertura emocional', 'Pausa consciente'],
    color: '#DFC08A',
    description:
      'Para rituales que invitan a suavizar la autoexigencia y volver al cuerpo con cuidado.',
    icon: 'heart',
    id: 'self-love',
    name: 'Amor propio',
    recommendedProductIds: ['prod-cuarzo-rosa-andino', 'prod-collar-amatista'],
    relatedCategoryIds: ['crystals-minerals', 'energetic-jewelry'],
    ritualPrompt:
      'Sostener la pieza elegida cerca del corazon y nombrar una forma concreta de cuidarte hoy.',
    seo: {
      description:
        'Productos y rituales para amor propio, calma emocional y cuidado personal.',
      keywords: ['amor propio', 'cuarzo rosa', 'ritual personal'],
      title: 'Amor propio | Auralith',
    },
    slug: 'amor-propio',
    sortOrder: 1,
  },
  {
    affirmation: 'Libero lo que pesa y abro espacio a lo nuevo.',
    benefits: ['Renovacion', 'Limpieza de ambientes', 'Cierre de ciclos'],
    color: '#8FA58C',
    description:
      'Para limpiar ambientes, objetos y energia personal antes de iniciar una nueva etapa.',
    icon: 'sparkles',
    id: 'energy-cleansing',
    name: 'Limpieza energetica',
    recommendedProductIds: ['prod-palo-santo-piurano', 'prod-bruma-munay'],
    relatedCategoryIds: ['sahumos-aromas', 'home-altar'],
    ritualPrompt:
      'Abrir una ventana, recorrer el espacio en sentido horario y cerrar con gratitud.',
    seo: {
      description:
        'Herramientas para limpieza energetica con sahumos, brumas y objetos rituales.',
      keywords: ['limpieza energetica', 'sahumo', 'palo santo'],
      title: 'Limpieza energetica | Auralith',
    },
    slug: 'limpieza-energetica',
    sortOrder: 2,
  },
  {
    affirmation: 'Mi energia tiene limites claros y amorosos.',
    benefits: ['Limites', 'Resguardo energetico', 'Enraizamiento'],
    color: '#6B8A68',
    description:
      'Para sostener limites, proteger el descanso y acompanar momentos de alta exposicion.',
    icon: 'shield',
    id: 'protection',
    name: 'Proteccion',
    recommendedProductIds: ['prod-sahumador-cusco', 'prod-cuenco-cobre'],
    relatedCategoryIds: ['home-altar', 'crystals-minerals'],
    ritualPrompt:
      'Trazar un circulo simbolico alrededor del altar y declarar que energia puede entrar.',
    seo: {
      description:
        'Productos holisiticos para proteccion energetica, limites y hogar consciente.',
      keywords: ['proteccion energetica', 'limites', 'altar'],
      title: 'Proteccion | Auralith',
    },
    slug: 'proteccion',
    sortOrder: 3,
  },
  {
    affirmation: 'Recibo con claridad, gratitud y direccion.',
    benefits: ['Expansion', 'Gratitud', 'Intencion financiera'],
    color: '#C9A86A',
    description:
      'Para rituales de apertura, prosperidad y decisiones alineadas con crecimiento real.',
    icon: 'sun',
    id: 'abundance',
    name: 'Abundancia',
    recommendedProductIds: ['prod-aceite-inti', 'prod-set-luna-nueva'],
    relatedCategoryIds: ['ritual-kits', 'holistic-care'],
    ritualPrompt:
      'Escribir una intencion de abundancia en presente y ungir las manos antes de actuar.',
    seo: {
      description:
        'Rituales y productos para abundancia, prosperidad y expansion consciente.',
      keywords: ['abundancia', 'prosperidad', 'aceite ritual'],
      title: 'Abundancia | Auralith',
    },
    slug: 'abundancia',
    sortOrder: 4,
  },
  {
    affirmation: 'Mi cuerpo descansa; mi mente se aquieta.',
    benefits: ['Descanso', 'Regulacion', 'Rituales nocturnos'],
    color: '#C4B8AB',
    description:
      'Para bajar el ritmo, preparar el descanso y acompanar practicas suaves de noche.',
    icon: 'moon',
    id: 'calm-sleep',
    name: 'Calma y sueno',
    recommendedProductIds: ['prod-vela-pachamama', 'prod-elixir-floral-killa'],
    relatedCategoryIds: ['holistic-care', 'home-altar', 'sahumos-aromas'],
    ritualPrompt:
      'Apagar pantallas, encender una vela y respirar diez veces antes de escribir.',
    seo: {
      description:
        'Productos para calma, descanso, sueno y rituales nocturnos.',
      keywords: ['calma', 'sueno', 'ritual nocturno'],
      title: 'Calma y sueno | Auralith',
    },
    slug: 'calma-y-sueno',
    sortOrder: 5,
  },
  {
    affirmation: 'Veo con claridad y elijo con calma.',
    benefits: ['Foco', 'Decision', 'Journaling'],
    color: '#9F8F7E',
    description:
      'Para ordenar ideas, iniciar proyectos y acompanar lecturas intuitivas con foco.',
    icon: 'eye',
    id: 'clarity-focus',
    name: 'Claridad y enfoque',
    recommendedProductIds: ['prod-oraculo-andino', 'prod-sal-maras'],
    relatedCategoryIds: ['oracles-guides', 'ritual-kits'],
    ritualPrompt:
      'Formular una pregunta especifica, respirar y registrar la primera respuesta honesta.',
    seo: {
      description:
        'Herramientas para claridad mental, enfoque, journaling y decisiones conscientes.',
      keywords: ['claridad', 'enfoque', 'oraculo', 'journaling'],
      title: 'Claridad y enfoque | Auralith',
    },
    slug: 'claridad-y-enfoque',
    sortOrder: 6,
  },
]
