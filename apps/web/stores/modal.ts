import { ContentCategory } from '@/lib/model/content'
import { createStore } from 'zustand'
import { devtools } from 'zustand/middleware'

export enum ModalType {
  // default
  None = 'none',

  // orders
  ApproveOrder = 'approve-order',
  RejectOrder = 'reject-order',
  CreateOrder = 'create-order',

  // profile
  ProfileSearch = 'profile-search',
  TrackTwitchChannelReward = 'track-twitch-channel-reward',

  // content notes
  DeleteContentAlert = 'delete-content-alert',
  ManualNoteCreation = 'manual-note-creation',
  GameNote = 'game-note',
  GameNoteEditor = 'game-note-editor',
  GameNoteCreator = 'game-note-creator',
  MovieNote = 'movie-note',
  MovieNoteEditor = 'movie-note-editor',
  MovieNoteCreator = 'movie-note-creator',

  // collections
  EditCollection = 'edit-collection',
  AddCollectionItem = 'add-collection-item',
  CreateCollection = 'create-collection',
  DeleteCollectionAlert = 'delete-collection-alert',

  // IGDB
  SelectContentItem = 'select-content-item',

  // show more profile
  ShowMoreProfile = 'show-more-profile',
}

export type ModalParamValue = string | string[] | undefined
export type ModalParams = Record<string, ModalParamValue>

type EmptyModalParams = Record<string, never>

export type ModalParamsMap = {
  [ModalType.None]: undefined
  [ModalType.ApproveOrder]: { id: string }
  [ModalType.RejectOrder]: { id: string; message?: string; odn?: string }
  [ModalType.CreateOrder]: EmptyModalParams
  [ModalType.ProfileSearch]: { query?: string }
  [ModalType.TrackTwitchChannelReward]: EmptyModalParams
  [ModalType.DeleteContentAlert]: {
    category: ContentCategory
    title: string
    id: string
  }
  [ModalType.ManualNoteCreation]: { category?: ContentCategory }
  [ModalType.GameNote]: { noteId: string }
  [ModalType.GameNoteEditor]: { noteId: string }
  [ModalType.GameNoteCreator]: { gameId: string }
  [ModalType.MovieNote]: { noteId: string }
  [ModalType.MovieNoteEditor]: { noteId: string }
  [ModalType.MovieNoteCreator]: { movieId: string }
  [ModalType.EditCollection]: { id: string }
  [ModalType.AddCollectionItem]: { id: string; query?: string }
  [ModalType.CreateCollection]: EmptyModalParams
  [ModalType.DeleteCollectionAlert]: { id: string; name: string }
  [ModalType.SelectContentItem]: { category: ContentCategory; query?: string }
  [ModalType.ShowMoreProfile]: EmptyModalParams
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isString = (value: unknown): value is string => typeof value === 'string'

const isContentCategory = (value: unknown): value is ContentCategory =>
  value === 'games' || value === 'movies'

export function getModalParams<T extends ModalType>(
  type: T,
  params: ModalParams | undefined,
): ModalParamsMap[T] | undefined {
  if (!params || !isObject(params)) return {} as ModalParamsMap[T]

  switch (type) {
    case ModalType.ApproveOrder:
      if (isString(params.id)) return { id: params.id } as ModalParamsMap[T]
      return {} as ModalParamsMap[T]
    case ModalType.RejectOrder:
      if (!isString(params.id)) return {} as ModalParamsMap[T]
      return {
        id: params.id,
        message: isString(params.message) ? params.message : undefined,
        odn: isString(params.odn) ? params.odn : undefined,
      } as ModalParamsMap[T]
    case ModalType.DeleteContentAlert:
      if (
        isString(params.id) &&
        isString(params.title) &&
        isContentCategory(params.category)
      ) {
        return {
          id: params.id,
          title: params.title,
          category: params.category,
        } as ModalParamsMap[T]
      }
      return {} as ModalParamsMap[T]
    case ModalType.ManualNoteCreation:
      if (
        params.category === undefined ||
        isContentCategory(params.category)
      ) {
        return {
          category: params.category as ContentCategory | undefined,
        } as ModalParamsMap[T]
      }
      return {} as ModalParamsMap[T]
    case ModalType.GameNote:
    case ModalType.GameNoteEditor:
    case ModalType.MovieNote:
    case ModalType.MovieNoteEditor:
      if (isString(params.noteId)) {
        return { noteId: params.noteId } as ModalParamsMap[T]
      }
      return {} as ModalParamsMap[T]
    case ModalType.GameNoteCreator:
      if (isString(params.gameId)) {
        return { gameId: params.gameId } as ModalParamsMap[T]
      }
      return {} as ModalParamsMap[T]
    case ModalType.MovieNoteCreator:
      if (isString(params.movieId)) {
        return { movieId: params.movieId } as ModalParamsMap[T]
      }
      return {} as ModalParamsMap[T]
    case ModalType.EditCollection:
      if (isString(params.id)) return { id: params.id } as ModalParamsMap[T]
      return {} as ModalParamsMap[T]
    case ModalType.AddCollectionItem:
      if (!isString(params.id)) return undefined
      return {
        id: params.id,
        query: isString(params.query) ? params.query : undefined,
      } as ModalParamsMap[T]
    case ModalType.DeleteCollectionAlert:
      if (isString(params.id) && isString(params.name)) {
        return { id: params.id, name: params.name } as ModalParamsMap[T]
      }
      return {} as ModalParamsMap[T]
    case ModalType.SelectContentItem:
      if (!isContentCategory(params.category)) return {} as ModalParamsMap[T]
      return {
        category: params.category,
        query: isString(params.query) ? params.query : undefined,
      } as ModalParamsMap[T]
    case ModalType.ProfileSearch:
      return {
        query: isString(params.query) ? params.query : undefined,
      } as ModalParamsMap[T]
    case ModalType.TrackTwitchChannelReward:
    case ModalType.CreateOrder:
    case ModalType.CreateCollection:
    case ModalType.ShowMoreProfile:
      return {} as ModalParamsMap[T]
    case ModalType.None:
      return {} as ModalParamsMap[T]
    default:
      return {} as ModalParamsMap[T]
  }
}

type Action = {
  openModal: <T extends ModalType>(modalName: T, params?: ModalParamsMap[T]) => void
  setModalParams: (params: ModalParams) => void
  closeModal: () => void
}

type State = {
  currentModal: ModalType
  modalParams?: ModalParams
}

export type ModalStore = Action & State

const defaultInitialState: State = {
  currentModal: ModalType.None,
  modalParams: {},
}

const createModalStore = (initialState: State = defaultInitialState) => {
  return createStore<ModalStore>()(
    devtools((set) => ({
      ...initialState,
      openModal: (modalName, params) =>
        set(() => ({
          currentModal: modalName,
          modalParams: params ?? {},
        })),
      setModalParams: (params) =>
        set((state) => ({ ...state, modalParams: params })),
      closeModal: () => set(() => defaultInitialState),
    })),
  )
}

export default createModalStore
