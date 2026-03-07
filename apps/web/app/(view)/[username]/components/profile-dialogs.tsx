'use client'

import ApproveOrderDialog from '@/components/view/dialog/approve-order/approve-order-dialog'
import CreateOrderDialog from '@/components/view/dialog/create-order/create-order-dialog'
import DeleteContentAlertDialog from '@/components/view/dialog/delete-content-alert/delete-content-alert-dialog'
import GameNoteCreatorDialog from '@/components/view/dialog/game-note-creator/game-note-creator-dialog'
import GameNoteEditorDialog from '@/components/view/dialog/game-note-editor/game-note-editor-dialog'
import GameNoteDialog from '@/components/view/dialog/game-note/game-note-dialog'
import ManualNoteCreationDialog from '@/components/view/dialog/manual-note-creation/manual-note-creation-dialog'
import MovieNoteCreatorDialog from '@/components/view/dialog/movie-note-creator/movie-note-creator-dialog'
import MovieNoteEditorDialog from '@/components/view/dialog/movie-note-editor/movie-note-editor-dialog'
import MovieNoteDialog from '@/components/view/dialog/movie-note/movie-note-dialog'
import ProfileSearchDialog from '@/components/view/dialog/profile-search/profile-search-dialog'
import RejectOrderDialog from '@/components/view/dialog/reject-order/reject-order-dialog'
import SelectContentItemDialog from '@/components/view/dialog/select-content-item/select-content-item-dialog'
import ShowMoreProfileDialog from '@/components/view/dialog/show-more-profile/show-more-profile-dialog'

export default function ProfileDialogs() {
  return (
    <>
      <RejectOrderDialog />
      <ApproveOrderDialog />

      <ProfileSearchDialog />
      <ShowMoreProfileDialog />
      <CreateOrderDialog />
      <DeleteContentAlertDialog />

      <GameNoteDialog />
      <MovieNoteDialog />

      <ManualNoteCreationDialog />
      <GameNoteEditorDialog />
      <MovieNoteEditorDialog />
      <GameNoteCreatorDialog />
      <MovieNoteCreatorDialog />
      <SelectContentItemDialog />
    </>
  )
}
