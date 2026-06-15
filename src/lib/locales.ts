// ============================================================
// Supported survey locales + translated UI copy.
// Pure and dependency-free — safe on client, server, and email.
// ============================================================

export const LOCALES = ["en", "ar", "fr", "de", "es", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  pt: "Português",
};

/** Right-to-left locales. */
export const RTL_LOCALES: Locale[] = ["ar"];

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function normalizeLocale(v: unknown): Locale {
  return isLocale(v) ? v : "en";
}

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/** UI strings used on the survey page and in invitation emails. */
export interface SurveyStrings {
  anonymous: string;          // "100% anonymous"
  takeSurvey: string;         // CTA button
  questionOf: (n: number, total: number) => string;
  optional: string;
  back: string;
  next: string;
  submit: string;
  submitting: string;
  thankYou: string;
  recorded: string;           // "Your response has been recorded anonymously."
  identityNote: string;       // privacy footer
  emailGreeting: (name: string) => string;
  emailIntro: string;         // body line in the invite email
  emailSubject: (title: string) => string;
  notAtAll: string;           // scale endpoints
  extremely: string;
  yes: string;
  no: string;
}

const STRINGS: Record<Locale, SurveyStrings> = {
  en: {
    anonymous: "100% anonymous",
    takeSurvey: "Take the survey →",
    questionOf: (n, total) => `Question ${n} of ${total}`,
    optional: "Optional",
    back: "← Back",
    next: "Next",
    submit: "Submit response",
    submitting: "Submitting...",
    thankYou: "Thank you!",
    recorded: "Your response has been recorded anonymously.",
    identityNote: "Your identity is never stored or linked to this response.",
    emailGreeting: (name) => `Hi ${name},`,
    emailIntro: "We'd love to hear how you're doing. This short pulse survey takes less than 2 minutes and your responses are completely anonymous.",
    emailSubject: (title) => `Quick pulse survey: ${title}`,
    notAtAll: "1 — Not at all",
    extremely: "10 — Extremely",
    yes: "Yes",
    no: "No",
  },
  ar: {
    anonymous: "مجهول 100٪",
    takeSurvey: "ابدأ الاستبيان ←",
    questionOf: (n, total) => `السؤال ${n} من ${total}`,
    optional: "اختياري",
    back: "→ رجوع",
    next: "التالي",
    submit: "إرسال الرد",
    submitting: "جارٍ الإرسال...",
    thankYou: "شكراً لك!",
    recorded: "تم تسجيل ردك بشكل مجهول.",
    identityNote: "لا يتم تخزين هويتك أو ربطها بهذا الرد أبداً.",
    emailGreeting: (name) => `مرحباً ${name}،`,
    emailIntro: "نود معرفة رأيك. يستغرق هذا الاستبيان أقل من دقيقتين وردودك مجهولة تماماً.",
    emailSubject: (title) => `استبيان سريع: ${title}`,
    notAtAll: "١ — إطلاقاً",
    extremely: "١٠ — للغاية",
    yes: "نعم",
    no: "لا",
  },
  fr: {
    anonymous: "100 % anonyme",
    takeSurvey: "Répondre au sondage →",
    questionOf: (n, total) => `Question ${n} sur ${total}`,
    optional: "Facultatif",
    back: "← Retour",
    next: "Suivant",
    submit: "Envoyer la réponse",
    submitting: "Envoi...",
    thankYou: "Merci !",
    recorded: "Votre réponse a été enregistrée de manière anonyme.",
    identityNote: "Votre identité n'est jamais stockée ni liée à cette réponse.",
    emailGreeting: (name) => `Bonjour ${name},`,
    emailIntro: "Nous aimerions savoir comment vous allez. Ce sondage prend moins de 2 minutes et vos réponses sont totalement anonymes.",
    emailSubject: (title) => `Sondage rapide : ${title}`,
    notAtAll: "1 — Pas du tout",
    extremely: "10 — Énormément",
    yes: "Oui",
    no: "Non",
  },
  de: {
    anonymous: "100 % anonym",
    takeSurvey: "Umfrage starten →",
    questionOf: (n, total) => `Frage ${n} von ${total}`,
    optional: "Optional",
    back: "← Zurück",
    next: "Weiter",
    submit: "Antwort senden",
    submitting: "Wird gesendet...",
    thankYou: "Danke!",
    recorded: "Ihre Antwort wurde anonym gespeichert.",
    identityNote: "Ihre Identität wird niemals gespeichert oder mit dieser Antwort verknüpft.",
    emailGreeting: (name) => `Hallo ${name},`,
    emailIntro: "Wir würden gerne hören, wie es Ihnen geht. Diese kurze Umfrage dauert weniger als 2 Minuten und Ihre Antworten sind völlig anonym.",
    emailSubject: (title) => `Kurze Puls-Umfrage: ${title}`,
    notAtAll: "1 — Überhaupt nicht",
    extremely: "10 — Äußerst",
    yes: "Ja",
    no: "Nein",
  },
  es: {
    anonymous: "100 % anónimo",
    takeSurvey: "Responder la encuesta →",
    questionOf: (n, total) => `Pregunta ${n} de ${total}`,
    optional: "Opcional",
    back: "← Atrás",
    next: "Siguiente",
    submit: "Enviar respuesta",
    submitting: "Enviando...",
    thankYou: "¡Gracias!",
    recorded: "Tu respuesta se ha registrado de forma anónima.",
    identityNote: "Tu identidad nunca se almacena ni se vincula a esta respuesta.",
    emailGreeting: (name) => `Hola ${name},`,
    emailIntro: "Nos encantaría saber cómo estás. Esta breve encuesta toma menos de 2 minutos y tus respuestas son completamente anónimas.",
    emailSubject: (title) => `Encuesta rápida: ${title}`,
    notAtAll: "1 — Para nada",
    extremely: "10 — Muchísimo",
    yes: "Sí",
    no: "No",
  },
  pt: {
    anonymous: "100% anônimo",
    takeSurvey: "Responder à pesquisa →",
    questionOf: (n, total) => `Pergunta ${n} de ${total}`,
    optional: "Opcional",
    back: "← Voltar",
    next: "Próxima",
    submit: "Enviar resposta",
    submitting: "Enviando...",
    thankYou: "Obrigado!",
    recorded: "Sua resposta foi registrada de forma anônima.",
    identityNote: "Sua identidade nunca é armazenada ou vinculada a esta resposta.",
    emailGreeting: (name) => `Olá ${name},`,
    emailIntro: "Gostaríamos de saber como você está. Esta pesquisa rápida leva menos de 2 minutos e suas respostas são totalmente anônimas.",
    emailSubject: (title) => `Pesquisa rápida: ${title}`,
    notAtAll: "1 — Nem um pouco",
    extremely: "10 — Extremamente",
    yes: "Sim",
    no: "Não",
  },
};

export function getStrings(locale: Locale): SurveyStrings {
  return STRINGS[locale] ?? STRINGS.en;
}

/**
 * Resolve a question's text for a locale from a survey's `translations` JSON.
 * Falls back to the base text when no translation exists.
 */
export function translateQuestion(
  translations: unknown,
  questionId: string,
  baseText: string,
  locale: Locale
): string {
  if (locale === "en" || !translations || typeof translations !== "object") return baseText;
  const q = (translations as { questions?: Record<string, Record<string, string>> }).questions;
  const t = q?.[questionId]?.[locale];
  return typeof t === "string" && t.trim() ? t : baseText;
}
