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
  /** дата публикации у провайдера «2026-09-05» — для uploadDate в JSON-LD */
  uploadDate?: string;
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
  /** Название как у фильма, капсом. Желательно ≤14 символов; длинные реальные названия («Red Bull Annual Recap») переносятся в две строки */
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
  /**
   * Город, площадки, дата и год необязательны: у реальных работ пишем только то, что подтвердил клиент.
   * Пустое поле прячется во всех строках «клиент · город · год», а не заполняется догадкой.
   */
  city?: string;
  venues?: string[];
  /** «июль 2026» — с названием месяца, иначе uploadDate в JSON-LD берётся из fullVideo.uploadDate */
  date?: string;
  year?: number;
  loop: MediaLoop;
  fullVideo?: FullVideo;
  /** Съёмка и пост необязательны: без подтверждённых фактов ячейки «Съёмка» и «Сдача» не выводятся */
  shooting?: {
    days?: number;
    hours?: number;
    /** «1 оператор + второй на церемонии» */
    operators?: string;
    drone?: boolean;
    gear?: string[];
  };
  post?: {
    /** «тизер 9 дней · фильм 6 недель» */
    delivery?: string;
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
  /** Титры: только подтверждённые роли. Пусто — блок титров без строк (остаются теги) */
  credits?: Credit[];
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
  /** язык названия, если не русский (<span lang>): казахское «Қыз ұзату · …» */
  lang?: "kk";
  /** «wedding film / feature film» */
  term: string;
  /** «8–15 мин» */
  duration: string;
  /** «сдача 4–8 недель» */
  turnaround?: string;
  /**
   * Как считается цена (ответы Маши, 2026-11): time — по времени съёмки, тарифы «час / полдня / день»
   * из pricing.json (tab "time"); unit — за единицу контента, «от N ₸ за ролик» (tab "unit");
   * custom — индивидуально (длинный хронометраж, анимация). Нет поля — time.
   */
  priceModel?: "time" | "unit" | "custom";
  /** своя цена «от», ₸ — только если у формата она отличается от общего тарифа; иначе берётся из pricing.json */
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
  /** «ЧАС», «ПОЛДНЯ», «ВЕСЬ ДЕНЬ», «ДЛЯ СОЦСЕТЕЙ» */
  name: string;
  /** time — тарифы по времени съёмки (час / полдня / день), unit — за единицу контента (ролик для соцсетей) */
  tab: "time" | "unit";
  /** ₸ */
  fromPrice: number;
  /** единица цены: «за ролик», «в час»; нет — цена за тариф целиком */
  unit?: string;
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
  /**
   * Шоурил: loop — фон hero и страницы /showreel (монтаж из реальных работ).
   * film — полный шоурил у провайдера; пока его нет, кнопки «Шоурил MM:SS» не выводятся.
   */
  showreel?: { loop: MediaLoop; film?: FullVideo };
  counters?: { value: string; label: string }[];
  toggles: {
    showPrices: boolean;
    showExactPrices: boolean;
    showTestimonials: boolean;
    showClients: boolean;
    showPlaceholders: boolean;
    /** плашка «цены — демо, до согласования» на /pricing, главной и страницах форматов — отдельно от showPlaceholders */
    pricesAreDemo?: boolean;
    /** «Обо мне» ещё демо: счётчики и «сейчас: …» скрыты, фото подписано «демо» и не уходит в JSON-LD Person */
    aboutIsDemo?: boolean;
    /** показывать занятость (settings.availability): проверка даты в форме и ближайшие свободные даты */
    showAvailability?: boolean;
  };
  about: {
    portrait?: Still;
    paragraphs: string[];
    gear: string;
    locations: string[];
    process: { step: string; text: string }[];
  };
  legal: { entity?: string; privacyUpdated?: string };
  /**
   * Занятость — ведёт Маша (позже в админке). busy — занятые дни «YYYY-MM-DD» (часовой пояс Алматы);
   * updated — когда список обновлялся: старше 30 дней — блоки занятости не показываем, чтобы не врать.
   */
  availability?: { updated: string; busy: string[] };
}
