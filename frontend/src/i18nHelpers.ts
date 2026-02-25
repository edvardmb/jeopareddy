import type { TFunction } from 'i18next'

export function translateGameStatus(status: string, t: TFunction): string {
  if (status === 'Draft') {
    return t('status.draft')
  }

  if (status === 'InProgress') {
    return t('status.inProgress')
  }

  return status || t('status.unknown')
}
