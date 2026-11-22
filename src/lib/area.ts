export type Area = 'jaro' | 'la_paz' | 'mandurriao'

export const AREA_LABELS: Record<Area, string> = {
  jaro: 'Jaro',
  la_paz: 'La Paz',
  mandurriao: 'Mandurriao',
}

export function areaLabel(area: Area | null | undefined): string | null {
  return area ? AREA_LABELS[area] : null
}
