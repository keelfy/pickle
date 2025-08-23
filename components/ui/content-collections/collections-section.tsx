import CollectionHeaderLine from '@/components/ui/content-collections/collection-header'
import CreateCollectionTitleButton from '@/components/ui/content-collections/create-collection-title-button'
import {
  fetchCollections,
  fetchCollectionsItems,
  fetchProfileByUsername,
} from '@/hooks/api-endpoints-server'
import AddCollectionItemDialog from '../../view/dialog/add-collection-item/add-collection-item-dialog'
import CreateCollectionDialog from '../../view/dialog/create-collection/create-collection-dialog'

import DeleteCollectionAlertDialog from '../../view/dialog/delete-collection-alert/delete-collection-alert-dialog'
import EditCollectionDialog from '../../view/dialog/edit-collection/edit-collection-dialog'
import { CollectionsProvider } from './collections-context'
import CollectionsList from './collections-list'

type Props = {
  username: string
}

export default async function CollectionsSection({ username }: Props) {
  const profile = await fetchProfileByUsername(username).catch(() => {
    return undefined
  })

  if (!profile) return null

  const [collections, collectionsItems] = await Promise.all([
    fetchCollections(profile).catch(() => {
      return []
    }),
    fetchCollectionsItems(profile, 10).catch(() => {
      return []
    }),
  ])

  return (
    <CollectionsProvider
      collections={collections}
      itemBatches={collectionsItems}
    >
      <div className="flex flex-col gap-4">
        <CollectionsList
          isUserAuthorized={profile.context?.isAuthorized ?? false}
        />
        {profile.context?.isAuthorized && (
          <CollectionHeaderLine leftSide={<CreateCollectionTitleButton />} />
        )}
        <CreateCollectionDialog />
        <DeleteCollectionAlertDialog />
        <AddCollectionItemDialog />
        <EditCollectionDialog />
      </div>
    </CollectionsProvider>
  )
}
