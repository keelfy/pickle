import { ContentCategory, ContentCategoryEnum } from './model/content'

const schemaTypeByCategory: Record<ContentCategory, string> = {
  [ContentCategoryEnum.Games]: 'VideoGame',
  [ContentCategoryEnum.Movies]: 'Movie',
  [ContentCategoryEnum.Anime]: 'TVSeries',
  [ContentCategoryEnum.Series]: 'TVSeries',
  [ContentCategoryEnum.Videos]: 'VideoObject',
  [ContentCategoryEnum.Custom]: 'CreativeWork',
  [ContentCategoryEnum.Any]: 'CreativeWork',
}

export function categoryToSchemaType(category: ContentCategory): string {
  return schemaTypeByCategory[category] ?? 'CreativeWork'
}
