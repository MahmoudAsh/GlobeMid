import { useI18n } from '@/i18n/i18n-context'
import { CATEGORY_COLORS } from '@/lib/categories'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'

const cssVar = (c: Category) => `var(--cat-${c})`

export function CategoryDot({ category, className }: { category: Category; className?: string }) {
  return <span aria-hidden className={cn('inline-block size-2.5 shrink-0 rounded-[3px]', className)} style={{ backgroundColor: cssVar(category) }} />
}

export function CategoryLabel({ category, className }: { category: Category; className?: string }) {
  const { t } = useI18n()
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', className)}>
      <CategoryDot category={category} />
      {t.category[category]}
    </span>
  )
}

/** Small outlined badge — rows can carry several. */
export function CategoryBadge({ category }: { category: Category }) {
  const { t } = useI18n()
  return (
    <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs whitespace-nowrap">
      <CategoryDot category={category} className="size-2" />
      {t.category[category]}
    </span>
  )
}

export function CategoryBadges({ categories }: { categories: Category[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {categories.map((c) => (
        <CategoryBadge key={c} category={c} />
      ))}
    </div>
  )
}

/** Defines --cat-annual etc. for light and dark mode from the single colour table. */
export function CategoryColorVars() {
  const entries = Object.entries(CATEGORY_COLORS)
  const css = `:root{${entries.map(([c, v]) => `--cat-${c}:${v.light};`).join('')}}
.dark{${entries.map(([c, v]) => `--cat-${c}:${v.dark};`).join('')}}`
  return <style>{css}</style>
}
