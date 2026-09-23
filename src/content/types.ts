/**
 * Контент-модель сайта madelarme.
 * Сейчас данные лежат в JSON рядом (src/content/*.json), позже — коллекции Payload CMS
 * с теми же полями. Любое изменение схемы здесь = изменение контракта админки.
 */

export type Locale = "ru" | "kk" | "en";

/** Группы форматов на странице /formats */
export type FormatGroup = "wedding" | "brand" | "content";

/** Сквозной тег настроения (фильтр на кейсах, паттерн Romavera) */
export type Mood = "bold" | "gentle" | "documentary";

/** Провайдер полного фильма в плеере-оверлее */
export type VideoProvider = "self" | "bunny" | "kinescope" | "vimeo" | "youtube";

export interface MediaLoop {
  /** горизонтальный луп 16:9, mp4 H.264 720p, без звука, ≤4 МБ */
  mp4H: string;
  /** вертикальный луп 9:16, 720×1280, ≤3 МБ — для hero/индекса на телефоне */
  mp4V?: string;
  /** постеры WebP: 16:9 обязателен, 9:16 и 4:5 — по возможности */
  posterH: string;
  posterV?: string;
  poster45?: string;
  /** длительность лупа, сек (для UI и лимитов) */
  seconds?: number;
}

export interface FullVideo {
  provider: VideoProvider;
  /** id у провайдера или путь к mp4 при provider = self */
  id: string;
  /** «08:12» */
  duration: string;
  /** есть ли звук — для тумблера в плеере */
  hasSound?: boolean;
}

export interface Deliverable {
  /** «Тизер», «SDE», «Фильм», «Reels», «Полная церемония» */
  name: string;
  /** «0:60», «8:12», «5 × 0:15–0:30» */
  duration: string;
  /** «16:9», «9:16», «16:9 + 9:16» */
  aspect?: string;
  /** доп. факт: «показан на банкете в 22:40» */
  note?: string;
}

export interface Credit {
  role: string;
  name: string;
  link?: string;
}

export interface Still {
  src: string;
  alt: string;
  /** ширина/высота для aspect-ratio (CLS 0) */
  w: number;
  h: number;
  caption?: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  /** «свадьба · 2026» / «бренд-менеджер, Brew Coffee» */
  role?: string;
  /** slug кейса, к которому относится */
  caseSlug?: string;
  /** подтверждён клиентом (иначе не показываем в проде) */
  confirmed: boolean;
}

export interface Case {
  slug: string;
  /** Название как у фильма, капсом, ≤14 символов (мобильная строка индекса) */
  title: string;
  /** Одна дерзкая фраза */
  logline: string;
  /** Пара или бренд: «Айгерим & Данияр», «Brew Coffee» */
  client: string;
  /** родительный падеж для CTA «Хочу как у …»: «Айгерим & Данияра». Нет — берётся title кейса */
  clientGen?: string;
  /** slug формата из formats.json */
  format: string;
  /** дополнительные форматы (например, SDE + Reels внутри свадьбы) */
  extraFormats?: string[];
  mood: Mood[];
  city: string;
  venues?: string[];
  /** «июль 2026» */
  date: string;
  year: number;
  loop: MediaLoop;
  fullVideo?: FullVideo;
  shooting: {
    days?: number;
    hours?: number;
    /** «1 оператор + второй на церемонии» */
    operators: string;
    drone?: boolean;
    gear?: string[];
  };
  post: {
    /** «тизер 9 дней · фильм 6 недель» */
    delivery: string;
    notes?: string;
  };
  task: string;
  approach: string;
  result?: {
    /** «Тизер показан на банкете в 22:40» */
    text?: string;
    metrics?: { value: string; label: string }[];
  };
  deliverables: Deliverable[];
  credits: Credit[];
  reels?: MediaLoop[];
  stills?: Still[];
  testimonial?: Testimonial;
  featuredIn?: string;
  /** демо-контент: сток + вымышленный клиент. В проде скрывается одной кнопкой, вне sitemap */
  isPlaceholder: boolean;
  /** работа реальная (видео Марии), но факты кейса ещё не подтверждены — плашка «факты на согласовании» вместо «клиент вымышлен» */
  factsUnconfirmed?: boolean;
  isPublished: boolean;
  /** показывать в «избранном» на главной */
  featured: boolean;
  sortOrder: number;
  seo?: { title?: string; description?: string };
}

export interface Format {
  slug: string;
  group: FormatGroup;
  /** «Свадебный фильм» */
  name: string;
  /** короткое имя для <title>/SEO, если name длинное («Той и қыз ұзату») */
  seoName?: string;
  /** «wedding film / feature film» */
  term: string;
  /** «8–15 мин» */
  duration: string;
  /** «сдача 4–8 недель» */
  turnaround?: string;
  /** цена «от», ₸; отсутствует = «индивидуально» */
  fromPrice?: number;
  /** абзац от Маши: кому это нужно */
  intro: string;
  /** что получаете на руки */
  deliverables: string[];
  /** как проходит день/съёмка — шаги */
  process?: string[];
  faq?: { q: string; a: string }[];
  /** луп формата для hero страницы формата */
  loop?: MediaLoop;
  /** аддон, не самостоятельная категория (дрон, backstage) */
  isAddon?: boolean;
  /** скрыть до появления работ */
  isPublished: boolean;
  sortOrder: number;
}

export interface PriceCollection {
  slug: string;
  /** «УТРО», «ВЕСЬ ДЕНЬ», «ТОЙ» */
  name: string;
  tab: "wedding" | "brand";
  /** ₸ */
  fromPrice: number;
  /** бейдж «чаще всего» */
  badge?: string;
  /** строки ledger: [«Съёмка», «до 4 ч · 1 оператор»] */
  lines: { k: string; v: string }[];
  note?: string;
  sortOrder: number;
}

export interface Extra {
  name: string;
  /** «25 000 ₸», «+25%», «по запросу» */
  price: string;
  note?: string;
}

export interface FaqItem {
  q: string;
  a: string;
  /** где показывать */
  scope: ("pricing" | "wedding" | "brand" | "contact")[];
}

export interface Reel {
  slug: string;
  title: string;
  /** «Айгерим & Данияр, Медеу» */
  caption?: string;
  /** slug кейса */
  caseSlug?: string;
  loop: MediaLoop;
  /** полный ролик со звуком (если есть) */
  full?: FullVideo;
  isPlaceholder: boolean;
  sortOrder: number;
}

export interface Client {
  name: string;
  /** согласие на публичное упоминание получено */
  confirmed: boolean;
  caseSlug?: string;
}

export interface Settings {
  brand: { wordmark: string; monogram: string; person: string; role: string; city: string };
  /** «Свадебное кино для тех, кто не любит свадебное видео» */
  manifest: string[];
  /** hero-подпись под манифестом */
  heroSub: string;
  /** редактируется в админке: «сейчас: монтирую N&N» */
  statusNow: string;
  season: string;
  timezone: string;
  contacts: {
    phoneDisplay: string;
    /** для tel: и wa.me — только цифры с кодом страны */
    phoneDigits: string;
    email: string;
    instagram: string;
    telegram: string;
    youtube?: string;
    whatsappDefaultText: string;
  };
  /** предзаполнение WhatsApp по типу страницы; {title} подставляется */
  prefill: { home: string; case: string; format: string; pricing: string; contact: string };
  showreel?: FullVideo & { loop: MediaLoop };
  counters?: { value: string; label: string }[];
  toggles: {
    showPrices: boolean;
    showExactPrices: boolean;
    showTestimonials: boolean;
    showClients: boolean;
    showPlaceholders: boolean;
  };
  about: {
    portrait?: Still;
    paragraphs: string[];
    gear: string;
    locations: string[];
    process: { step: string; text: string }[];
  };
  legal: { entity?: string; privacyUpdated?: string };
}
