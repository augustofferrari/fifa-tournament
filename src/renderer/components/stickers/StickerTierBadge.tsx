import { StickerTier } from '@shared/types/sticker-tier'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { formatStickerTierLabel, getStickerTierClassName } from './sticker-tier-utils'

interface StickerTierBadgeProps {
  tier: StickerTier
  className?: string
  variant?: 'preview' | 'card' | 'header' | 'editor'
}

function getBaseClass(variant: StickerTierBadgeProps['variant']): string {
  switch (variant) {
    case 'card':
      return 'sticker-card__tier'
    case 'header':
      return 'sticker-preview__tier-header'
    case 'editor':
      return 'sticker-editor__tier-badge'
    default:
      return 'sticker-preview__badge sticker-preview__badge--tier'
  }
}

export function StickerTierBadge({ tier, className, variant = 'preview' }: StickerTierBadgeProps) {
  const { t } = useAppTranslation()
  const tierLabel = formatStickerTierLabel(tier, t)
  const baseClass = getBaseClass(variant)
  const modifierPrefix = baseClass.split(' ')[0]!
  const rootClassName = [baseClass, getStickerTierClassName(tier, modifierPrefix), className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClassName} aria-label={t('stickers.tier.label', { tier: tierLabel })}>
      {tierLabel}
    </div>
  )
}
