export function formatCategoryName(slug: string): string {
  const names: Record<string, string> = {
    'ikke-pa-nett': 'Ikke på nett',
    'tregt-nett': 'Tregt nett',
    'ustabilt-nett': 'Ustabilt nett',
  }
  return names[slug] ?? slug
}