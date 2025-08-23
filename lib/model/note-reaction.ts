export type ContentNoteReaction = {
  emoteId: string
  source: string
  count: number
  userReacted: boolean
}

export type ContentNoteReactions = {
  contentNoteId: string
  reactions: ContentNoteReaction[]
}
