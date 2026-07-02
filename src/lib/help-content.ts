import {
  CalendarCheck,
  Building2,
  CreditCard,
  ShieldCheck,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react'

interface Localized {
  he: string
  en: string
}

interface HelpSection {
  heading: Localized
  body: Localized
}

export interface HelpArticle {
  slug: string
  icon: LucideIcon
  title: Localized
  summary: Localized
  sections: HelpSection[]
}

export const helpArticles: HelpArticle[] = [
  {
    slug: 'booking',
    icon: CalendarCheck,
    title: { he: 'איך מזמינים מקום', en: 'How to book a venue' },
    summary: {
      he: 'מהחיפוש ועד לאישור המארח — כל מה שצריך לדעת כדי להזמין.',
      en: 'From search to host confirmation — everything you need to book.',
    },
    sections: [
      {
        heading: { he: 'חיפוש וסינון', en: 'Search and filter' },
        body: {
          he: 'השתמשו בשורת החיפוש כדי לבחור יעד, תאריכים, סוג אירוע ומספר אורחים. סננו לפי מחיר ומתקנים, ולחצו על "התאמה הטובה ביותר" כדי לראות את המקומות שמתאימים לכם ביותר.',
          en: 'Use the search bar to pick a destination, dates, event type and number of guests. Filter by price and amenities, and tap “Best match” to surface the venues that fit you best.',
        },
      },
      {
        heading: { he: 'בחירת תאריך ושעות', en: 'Choosing a date and time' },
        body: {
          he: 'בעמוד המקום, בחרו תאריך זמין בלוח ההזמנה. אפשר להזמין לפי שעה או ליום שלם — בהתאם למה שהמארח מציע. המחיר הסופי, כולל עמלת שירות של 15%, מוצג לפני התשלום.',
          en: 'On the venue page, pick an available date in the booking widget. Book by the hour or for a full day depending on what the host offers. The final price, including the 15% service fee, is shown before you pay.',
        },
      },
      {
        heading: { he: 'אישור ותשלום', en: 'Confirmation and payment' },
        body: {
          he: 'הבקשה נשלחת למארח והכרטיס שלכם מחויב רק לאחר שהמארח מאשר. תקבלו אימייל בכל שלב, ותוכלו לעקוב אחר הסטטוס תחת "ההזמנות שלי".',
          en: 'Your request goes to the host and your card is only charged once they accept. You’ll get an email at each step, and can track the status under “My bookings”.',
        },
      },
    ],
  },
  {
    slug: 'hosting',
    icon: Building2,
    title: { he: 'אירוח ב-VenueCharm', en: 'Hosting on VenueCharm' },
    summary: {
      he: 'פרסמו מקום, הגדירו זמינות ותמחור, ונהלו הזמנות.',
      en: 'List a venue, set availability and pricing, and manage bookings.',
    },
    sections: [
      {
        heading: { he: 'הפכו למארח', en: 'Become a host' },
        body: {
          he: 'לחצו על "פרסם מקום" בתפריט. לפני פרסום הרשומה הראשונה תתבקשו להשלים את חיבור התשלומים (Stripe) כדי שנוכל להעביר אליכם את התקבולים.',
          en: 'Tap “Become a host” in the menu. Before publishing your first listing you’ll complete Stripe payout onboarding so we can transfer your earnings.',
        },
      },
      {
        heading: { he: 'יצירת רשומה', en: 'Creating a listing' },
        body: {
          he: 'הוסיפו תיאור, תמונות, מיקום על המפה, מתקנים וסוגי אירועים. בחרו שיטת הזמנה — לפי שעה, ליום שלם או שניהם — והגדירו כללי בית ומדיניות ביטול.',
          en: 'Add a description, photos, a map location, amenities and event types. Choose a reservation system — per hour, per day or both — and set venue rules and a cancellation policy.',
        },
      },
      {
        heading: { he: 'ניהול זמינות והזמנות', en: 'Managing availability and bookings' },
        body: {
          he: 'בלוח המארח תוכלו לחסום תאריכים, לאשר או לדחות בקשות, ולתקשר עם אורחים. חיבור ליומן Google מסנכרן הזמנות מאושרות אוטומטית.',
          en: 'From the host dashboard you can block dates, accept or decline requests, and message guests. Connecting Google Calendar syncs confirmed bookings automatically.',
        },
      },
    ],
  },
  {
    slug: 'payments',
    icon: CreditCard,
    title: { he: 'תשלומים ועמלות', en: 'Payments and fees' },
    summary: {
      he: 'איך עובד התשלום, מתי מחייבים, ומה העמלה.',
      en: 'How payment works, when you’re charged, and what the fee is.',
    },
    sections: [
      {
        heading: { he: 'עמלת שירות', en: 'Service fee' },
        body: {
          he: 'VenueCharm גובה עמלת שירות של 15% מעל מחיר הבסיס של המקום. העמלה מוצגת בבירור בפירוט המחיר לפני התשלום.',
          en: 'VenueCharm charges a 15% service fee on top of the venue’s base price. The fee is shown clearly in the price breakdown before you pay.',
        },
      },
      {
        heading: { he: 'מתי מחויבים', en: 'When you’re charged' },
        body: {
          he: 'בעת שליחת הבקשה אנחנו שומרים את הסכום על הכרטיס אך לא מחייבים. החיוב מתבצע רק כשהמארח מאשר. אם המארח דוחה או שאתם מבטלים לפני אישור — לא בוצע חיוב.',
          en: 'When you send a request we place a hold on your card but don’t charge it. You’re only charged once the host accepts. If the host declines or you cancel before acceptance, nothing is charged.',
        },
      },
      {
        heading: { he: 'החזרים', en: 'Refunds' },
        body: {
          he: 'החזרים נקבעים לפי מדיניות הביטול של המקום (גמישה, מתונה או קפדנית) ומחושבים אוטומטית לפי מועד הביטול. הסכום מוחזר לאמצעי התשלום המקורי.',
          en: 'Refunds follow the venue’s cancellation policy (flexible, moderate or strict) and are calculated automatically based on when you cancel. Funds return to your original payment method.',
        },
      },
    ],
  },
  {
    slug: 'trust-safety',
    icon: ShieldCheck,
    title: { he: 'אמון ובטיחות', en: 'Trust and safety' },
    summary: {
      he: 'איך אנחנו שומרים על אורחים ומארחים.',
      en: 'How we keep guests and hosts protected.',
    },
    sections: [
      {
        heading: { he: 'מארחים מאומתים', en: 'Verified hosts' },
        body: {
          he: 'מקומות עוברים אישור לפני שהם מתפרסמים, ומארחים מאומתים מסומנים בתג. תוכלו לקרוא ביקורות של אורחים קודמים בכל עמוד מקום.',
          en: 'Venues are reviewed before they go live, and verified hosts carry a badge. You can read reviews from previous guests on every venue page.',
        },
      },
      {
        heading: { he: 'תשלומים מאובטחים', en: 'Secure payments' },
        body: {
          he: 'כל התשלומים עוברים דרך Stripe ואנחנו לעולם לא שומרים את פרטי הכרטיס שלכם. שמרו את התקשורת והתשלומים בתוך VenueCharm כדי שתהיו מוגנים.',
          en: 'All payments run through Stripe and we never store your card details. Keep communication and payments inside VenueCharm so you stay protected.',
        },
      },
      {
        heading: { he: 'דיווח על בעיה', en: 'Reporting a problem' },
        body: {
          he: 'אם משהו לא תקין, פנו אלינו דרך עמוד יצירת הקשר. אנחנו בודקים כל דיווח ונוקטים פעולה במידת הצורך.',
          en: 'If something isn’t right, reach out via the contact page. We review every report and take action where needed.',
        },
      },
    ],
  },
  {
    slug: 'faq',
    icon: HelpCircle,
    title: { he: 'שאלות נפוצות', en: 'Frequently asked questions' },
    summary: {
      he: 'תשובות מהירות לשאלות הנפוצות ביותר.',
      en: 'Quick answers to the most common questions.',
    },
    sections: [
      {
        heading: { he: 'האם הרשמה עולה כסף?', en: 'Is it free to sign up?' },
        body: {
          he: 'כן. ההרשמה והחיפוש חינמיים לחלוטין. עמלת השירות מתווספת רק כשמבצעים הזמנה.',
          en: 'Yes. Signing up and searching are completely free. The service fee only applies when you make a booking.',
        },
      },
      {
        heading: { he: 'נרשמתי כשוכר — איך אני הופך למארח?', en: 'I signed up as a renter — how do I become a host?' },
        body: {
          he: 'לחצו על "פרסם מקום" בתפריט. החשבון שלכם ישודרג ותוכלו להמשיך לעבור בין מצב אירוח למצב חיפוש מתי שתרצו.',
          en: 'Tap “Become a host” in the menu. Your account is upgraded and you can switch between hosting and traveling anytime.',
        },
      },
      {
        heading: { he: 'איך אני מבטל הזמנה?', en: 'How do I cancel a booking?' },
        body: {
          he: 'תחת "ההזמנות שלי" בחרו את ההזמנה ולחצו על ביטול. ההחזר מחושב לפי מדיניות הביטול של המקום.',
          en: 'Under “My bookings”, open the booking and choose cancel. Your refund is calculated from the venue’s cancellation policy.',
        },
      },
      {
        heading: { he: 'באילו שפות האתר תומך?', en: 'Which languages are supported?' },
        body: {
          he: 'VenueCharm זמין בעברית ובאנגלית. אפשר להחליף שפה מהתפריט בכל רגע.',
          en: 'VenueCharm is available in Hebrew and English. Switch languages from the menu at any time.',
        },
      },
    ],
  },
]

export function getHelpArticle(slug: string): HelpArticle | undefined {
  return helpArticles.find((a) => a.slug === slug)
}
