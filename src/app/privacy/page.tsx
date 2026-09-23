import type { Metadata } from "next";
import Link from "next/link";
import { Section, Container } from "@/components/ui/Section";
import { settings } from "@/lib/content";
import { STATIC_SITE } from "@/lib/lead";

export const metadata: Metadata = {
  title: "Персональные данные",
  description: "Какие данные я собираю через форму на сайте, зачем, куда они попадают и как их удалить.",
  alternates: { canonical: "/privacy" },
};

/** «2026-09-16» → «16.09.2026» без зависимости от таймзоны сервера */
function ruDate(iso?: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}.${m}.${y}` : iso;
}

export default function PrivacyPage() {
  const { contacts, legal, brand } = settings;
  const operator = legal.entity ?? brand.person;

  const sections: { h: string; p: string[] }[] = [
    {
      h: "Кто собирает",
      p: [
        `Оператор персональных данных — ${operator} (${brand.person}), ${brand.city}. Сайт ${brand.wordmark} — моя личная страница видеографа, не студия.`,
        `Обработка ведётся в соответствии с Законом Республики Казахстан «О персональных данных и их защите» № 94-V от 21 мая 2013 года.`,
      ],
    },
    {
      h: "Что собираю",
      p: [
        "Только то, что вы сами вводите в форму «Проверить дату»: имя, телефон или ник в мессенджере, желаемый формат съёмки, дату или период и текст сообщения.",
        "Email через форму не запрашиваю. Cookies для рекламы и сторонней аналитики на сайте не использую; технические cookies сервера — только для работы страниц.",
      ],
    },
    {
      h: "Зачем",
      p: [
        "Чтобы ответить на ваш запрос: проверить дату, уточнить детали и подготовить предложение. Другой цели нет — рассылок и передачи третьим лицам для рекламы не делаю.",
      ],
    },
    {
      h: "Куда попадают данные",
      p: [
        STATIC_SITE
          ? "Форма не отправляет данные на сервер сайта: она открывает WhatsApp с уже заполненным текстом заявки, и вы сами решаете, отправлять ли его мне. Переписка в WhatsApp, Telegram и Instagram ведётся по правилам этих сервисов."
          : "Заявка из формы отправляется мне уведомлением в Telegram (через бота, сервис Telegram Messenger Inc.). Переписка в WhatsApp, Telegram и Instagram ведётся по правилам этих сервисов.",
        STATIC_SITE
          ? "Сайт размещён на хостинге за пределами Казахстана; заявки на сайте не хранятся."
          : "Сайт размещён на хостинге за пределами Казахстана; заявки не хранятся в базе сайта дольше, чем нужно для доставки уведомления.",
      ],
    },
    {
      h: "Сколько храню",
      p: [
        "Пока идёт обсуждение и работа над проектом, затем — до 3 лет для учёта договоров и по требованиям законодательства. Заявки, по которым съёмка не состоялась, удаляю в течение года.",
      ],
    },
    {
      h: "Ваши права",
      p: [
        `Вы можете узнать, какие данные о вас есть, исправить их или попросить удалить — напишите на ${contacts.email} или в ${contacts.instagram}. Отвечаю в течение 3 рабочих дней, удаляю — в течение 10.`,
        "Согласие на обработку вы даёте, отмечая галочку в форме; отозвать его можно тем же письмом.",
      ],
    },
    {
      h: "Видео и публикации",
      p: [
        "Публикую ваши видео в портфолио и соцсетях только с вашего согласия — это отдельный пункт договора на съёмку, а не этой политики.",
      ],
    },
  ];

  return (
    <Section paper>
      <Container className="pt-[calc(var(--header-h)+40px)] pb-[calc(64px+var(--sticky-h))] md:pt-[calc(var(--header-h)+72px)] md:pb-[calc(96px+var(--sticky-h))]">
        <p className="mono text-meta">[ персональные данные ]</p>
        <h1 className="disp text-h2 mt-4 max-w-[14ch]">Как я храню ваши данные</h1>
        <p className="mono mt-6 text-meta">обновлено {ruDate(legal.privacyUpdated)}</p>

        <div className="mt-12 grid grid-cols-1 gap-y-10 md:mt-20 md:grid-cols-12 md:gap-x-8">
          <div className="md:col-span-7 md:col-start-5">
            {sections.map((s, i) => (
              <section key={s.h} className="border-t border-rule py-8 md:py-10">
                <h2 className="flex items-baseline gap-4">
                  <span className="mono text-meta">{String(i + 1).padStart(2, "0")}</span>
                  <span className="disp text-h3">{s.h}</span>
                </h2>
                {s.p.map((para) => (
                  <p key={para} className="mt-5 max-w-[62ch] text-[17px] leading-relaxed">
                    {para}
                  </p>
                ))}
              </section>
            ))}
            <p className="mono mt-10 text-meta">
              Вопросы —{" "}
              <a href={`mailto:${contacts.email}`} className="normal-case underline underline-offset-4 hover:text-signal">
                {contacts.email}
              </a>{" "}
              · <Link href="/contact" className="underline underline-offset-4 hover:text-signal">форма</Link>
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
