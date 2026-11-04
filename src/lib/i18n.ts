// The product ships in English only. The other locale dictionaries were
// removed so the interface cannot render a half-translated page: the public
// pages are hard-coded English, and offering a selector that only translated
// the navigation chrome produced Somali headings above English body copy.
export type Locale = "en";

export const LOCALES: { code: Locale; label: string; native: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", native: "English", dir: "ltr" },
];

type Dict = Record<string, string>;

const en: Dict = {
  "nav.home": "Home",
  "nav.about": "About Us",
  "nav.products": "Our Products",
  "nav.how": "How It Works",
  "nav.features": "Features",
  "nav.pricing": "Pricing Plans",
  "nav.hospital": "Hospital Solutions",
  "nav.contact": "Contact Us",
  "nav.getStarted": "Get Started",
  "nav.signIn": "Sign In",
  "nav.dashboard": "Open Dashboard",
  "nav.menu": "Menu",
  "nav.close": "Close",
  "hero.eyebrow": "FreeStyle Libre monitoring",
  "hero.title1": "Glucose monitoring,",
  "hero.title2": "shared with family.",
  "hero.body": "Connect a FreeStyle Libre sensor. Share real glucose readings and alerts with the people who care for you.",
  "hero.cta": "Get Started",
  "hero.secondary": "View Pricing",
  "hero.trust1": "Secure & encrypted",
  "hero.trust2": "Built around Libre data",
  "hero.trust3": "Family-first alerts",
  "lang.label": "Language",
  "cta.ready": "Ready to keep your family connected?",
  "cta.body": "Start with Family Basic today, or talk to us about hospital-wide monitoring.",
  "cta.primary": "Get Started",
  "cta.secondary": "Talk to our team",
  "footer.tagline": "Connected Families. Safer Together.",
  "footer.product": "Product",
  "footer.company": "Company",
  "footer.support": "Support",
  "footer.legal": "Legal & privacy",
  "footer.demo": "Demo workspace",
  "footer.rights": "All rights reserved.",
  "footer.notice":
    "Walhad CareLink supports, but does not replace, professional medical care or emergency services. Data availability depends on your sensor, the Libre apps and API access. Alerts cannot be guaranteed during network or device interruptions.",
  "common.loading": "Loading…",
  "common.save": "Save changes",
  "common.saved": "Saved",
  "common.cancel": "Cancel",
  "common.back": "Back",
};

const so: Dict = {
  "nav.home": "Bogga Hore",
  "nav.about": "Ku Saabsan",
  "nav.products": "Adeegyadeena",
  "nav.how": "Sida Ay U Shaqeyso",
  "nav.features": "Astaamaha",
  "nav.pricing": "Qiimaha",
  "nav.hospital": "Xalalka Isbitaallada",
  "nav.contact": "Nala Soo Xiriir",
  "nav.getStarted": "Bilow Hadda",
  "nav.signIn": "Gal",
  "nav.dashboard": "Fur Dashboard",
  "nav.menu": "Menu",
  "nav.close": "Xir",
  "hero.eyebrow": "Daryeel ku xiran FreeStyle Libre",
  "hero.title1": "La Soco Sonkorta Dhiigga Si Caqli Leh.",
  "hero.title2": "Xasillooni Maskaxeed Badan.",
  "hero.body": "Ku xidh sensor FreeStyle Libre. La wadaag qoyskaaga sonkorta dhiigga iyo digniinaha dhabta ah.",
  "hero.cta": "Bilow Hadda",
  "hero.secondary": "Eeg Qiimaha",
  "hero.trust1": "Ammaan & sir ilaalin",
  "hero.trust2": "Ku saleysan xogta Libre",
  "hero.trust3": "Digniinaha qoyska marka hore",
  "lang.label": "Luqadda",
  "cta.ready": "Ma diyaar baad tahay inaad qoyskaaga xiriiriso?",
  "cta.body": "Ka bilow Family Basic maanta, ama nala hadal isbitaal oo dhan.",
  "cta.primary": "Bilow Hadda",
  "cta.secondary": "La hadal kooxdeena",
  "footer.tagline": "Qoysas Xiriiran. Ammaan Wadajir.",
  "footer.product": "Adeegga",
  "footer.company": "Shirkadda",
  "footer.support": "Taageero",
  "footer.legal": "Sharci & asturnaan",
  "footer.demo": "Muuqaalka demo",
  "footer.rights": "Xuquuqda oo dhan way dhowran tahay.",
  "footer.notice":
    "Walhad CareLink waxay taageertaa daryeelka caafimaadka laakiin kama beddelanto adeegga degdegga ah. Helitaanka xogta waxay ku xiran tahay sensor-kaaga, apps-ka Libre iyo marin-u-helka API.",
  "common.loading": "Waa la soo dejinayaa…",
  "common.save": "Kaydi",
  "common.saved": "La kaydiyay",
  "common.cancel": "Jooji",
  "common.back": "Dib u noqo",
};

const ar: Dict = {
  "nav.home": "الرئيسية",
  "nav.about": "من نحن",
  "nav.products": "منتجاتنا",
  "nav.how": "كيف يعمل",
  "nav.features": "المزايا",
  "nav.pricing": "الأسعار",
  "nav.hospital": "حلول المستشفيات",
  "nav.contact": "اتصل بنا",
  "nav.getStarted": "ابدأ الآن",
  "nav.signIn": "تسجيل الدخول",
  "nav.dashboard": "لوحة التحكم",
  "nav.menu": "القائمة",
  "nav.close": "إغلاق",
  "hero.eyebrow": "رعاية متصلة بـ FreeStyle Libre",
  "hero.title1": "مراقبة أذكى للسكر.",
  "hero.title2": "طمأنينة أكبر.",
  "hero.body": "ابقَ على تواصل مع أحبائك عبر مراقبة ذكية للسكر وتنبيهات فورية ودعم عائلي عن بُعد.",
  "hero.cta": "ابدأ الآن",
  "hero.secondary": "عرض الأسعار",
  "hero.trust1": "آمن ومشفّر",
  "hero.trust2": "مبني على بيانات Libre",
  "hero.trust3": "تنبيهات تبدأ بالعائلة",
  "lang.label": "اللغة",
  "cta.ready": "هل أنت مستعد لإبقاء عائلتك متصلة؟",
  "cta.body": "ابدأ بخطة Family Basic اليوم، أو تحدث معنا حول مراقبة المستشفى بالكامل.",
  "cta.primary": "ابدأ الآن",
  "cta.secondary": "تحدث مع فريقنا",
  "footer.tagline": "عائلات متصلة. أكثر أماناً معاً.",
  "footer.product": "المنتج",
  "footer.company": "الشركة",
  "footer.support": "الدعم",
  "footer.legal": "القانون والخصوصية",
  "footer.demo": "نسخة تجريبية",
  "footer.rights": "جميع الحقوق محفوظة.",
  "footer.notice":
    "يدعم Walhad CareLink الرعاية الطبية المهنية لكنه لا يغني عنها أو عن خدمات الطوارئ. يعتمد توفر البيانات على المستشعر وتطبيقات Libre وصلاحية الوصول إلى الواجهة البرمجية.",
  "common.loading": "جارٍ التحميل…",
  "common.save": "حفظ",
  "common.saved": "تم الحفظ",
  "common.cancel": "إلغاء",
  "common.back": "رجوع",
};

export const dictionaries: Record<Locale, Dict> = { en };

export function translate(locale: Locale, key: string): string {
  return dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key;
}

export function dirFor(_locale: Locale): "ltr" | "rtl" {
  return "ltr";
}
