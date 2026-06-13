import {
  Wifi, Car, Volume2, UtensilsCrossed, Trees, Accessibility,
  Thermometer, Projector, ShowerHead, Coffee, Dumbbell, Music,
  Wine, Waves, ChefHat, Mic2, ShieldCheck, Sofa,
  Flower2, Lightbulb, Flame, ArrowUpDown, Shirt, Camera,
  CheckCircle2, type LucideIcon,
} from 'lucide-react'

export interface Amenity {
  key: string
  label_en: string
  label_he: string
  category: string
  icon: string
  sort_order?: number
  is_active?: boolean
}

/** Registry mapping the DB `icon` string to a Lucide component. */
export const AMENITY_ICONS: Record<string, LucideIcon> = {
  Wifi, Car, Volume2, UtensilsCrossed, Trees, Accessibility,
  Thermometer, Projector, ShowerHead, Coffee, Dumbbell, Music,
  Wine, Waves, ChefHat, Mic2, ShieldCheck, Sofa,
  Flower2, Lightbulb, Flame, ArrowUpDown, Shirt, Camera, CheckCircle2,
}

/** Icon names selectable in the admin CRUD UI. */
export const AMENITY_ICON_NAMES = Object.keys(AMENITY_ICONS)

export const AMENITY_CATEGORIES = [
  'Core',
  'AV & Events',
  'Food & Drink',
  'Outdoor & Spaces',
  'Facilities',
  'Other',
] as const

export function amenityIcon(name: string | undefined | null): LucideIcon {
  return (name && AMENITY_ICONS[name]) || CheckCircle2
}

export function amenityLabel(a: Amenity, isHe: boolean): string {
  return isHe ? a.label_he : a.label_en
}

/**
 * Static fallback list, used while the catalog loads on the client and as a
 * safety net if the `amenities` table is empty. Mirrors migration 012's seed.
 */
export const DEFAULT_AMENITIES: Amenity[] = [
  { key: 'WiFi',             label_en: 'WiFi',              label_he: 'WiFi',          category: 'Core',             icon: 'Wifi',            sort_order: 10 },
  { key: 'Parking',          label_en: 'Parking',          label_he: 'חניה',          category: 'Core',             icon: 'Car',             sort_order: 20 },
  { key: 'Air conditioning', label_en: 'Air Conditioning', label_he: 'מיזוג אוויר',   category: 'Core',             icon: 'Thermometer',     sort_order: 30 },
  { key: 'Heating',          label_en: 'Heating',          label_he: 'חימום',         category: 'Core',             icon: 'Flame',           sort_order: 40 },
  { key: 'Elevator',         label_en: 'Elevator',         label_he: 'מעלית',         category: 'Core',             icon: 'ArrowUpDown',     sort_order: 50 },
  { key: 'Accessible',       label_en: 'Wheelchair Access',label_he: 'נגיש לנכים',    category: 'Core',             icon: 'Accessibility',   sort_order: 60 },
  { key: 'AV',               label_en: 'AV Equipment',     label_he: 'ציוד שמע/וידאו',category: 'AV & Events',      icon: 'Volume2',         sort_order: 70 },
  { key: 'Projector',        label_en: 'Projector',        label_he: 'מקרן',          category: 'AV & Events',      icon: 'Projector',       sort_order: 80 },
  { key: 'Lighting',         label_en: 'Lighting System',  label_he: 'תאורה מקצועית', category: 'AV & Events',      icon: 'Lightbulb',       sort_order: 90 },
  { key: 'Stage',            label_en: 'Stage',            label_he: 'במה',           category: 'AV & Events',      icon: 'Mic2',            sort_order: 100 },
  { key: 'Music',            label_en: 'Music System',     label_he: 'מערכת מוסיקה',  category: 'AV & Events',      icon: 'Music',           sort_order: 110 },
  { key: 'Kitchen',          label_en: 'Kitchen',          label_he: 'מטבח',          category: 'Food & Drink',     icon: 'UtensilsCrossed', sort_order: 120 },
  { key: 'Coffee',           label_en: 'Coffee Station',   label_he: 'קפה',           category: 'Food & Drink',     icon: 'Coffee',          sort_order: 130 },
  { key: 'Catering',         label_en: 'Catering',         label_he: 'קייטרינג',      category: 'Food & Drink',     icon: 'ChefHat',         sort_order: 140 },
  { key: 'Bar',              label_en: 'Bar',              label_he: 'בר',            category: 'Food & Drink',     icon: 'Wine',            sort_order: 150 },
  { key: 'Outdoor',          label_en: 'Outdoor Space',    label_he: 'שטח חוץ',       category: 'Outdoor & Spaces', icon: 'Trees',           sort_order: 160 },
  { key: 'Garden',           label_en: 'Garden',           label_he: 'גינה',          category: 'Outdoor & Spaces', icon: 'Flower2',         sort_order: 170 },
  { key: 'Pool',             label_en: 'Pool',             label_he: 'בריכה',         category: 'Outdoor & Spaces', icon: 'Waves',           sort_order: 180 },
  { key: 'Lounge',           label_en: 'Lounge Area',      label_he: 'פינת ישיבה',    category: 'Outdoor & Spaces', icon: 'Sofa',            sort_order: 190 },
  { key: 'Shower',           label_en: 'Shower',           label_he: 'מקלחת',         category: 'Facilities',       icon: 'ShowerHead',      sort_order: 200 },
  { key: 'Gym',              label_en: 'Gym',              label_he: 'חדר כושר',      category: 'Facilities',       icon: 'Dumbbell',        sort_order: 210 },
  { key: 'Dressing Room',    label_en: 'Dressing Room',    label_he: 'חדר הלבשה',     category: 'Facilities',       icon: 'Shirt',           sort_order: 220 },
  { key: 'Photo Studio',     label_en: 'Photo Studio',     label_he: 'סטודיו צילום',  category: 'Facilities',       icon: 'Camera',          sort_order: 230 },
  { key: 'Security',         label_en: 'Security',         label_he: 'אבטחה',         category: 'Facilities',       icon: 'ShieldCheck',     sort_order: 240 },
]
