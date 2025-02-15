import CollectionHeaderLine from "@/components/view/content-collections/collection-header";
import CreateCollectionTitleButton from "@/components/view/content-collections/create-collection-title-button";
import { fetchCollections, fetchCollectionsItems, fetchProfileByLink } from "@/hooks/api-endpoints-server";
import AddCollectionItemDialog from "../dialog/add-collection-item/add-collection-item-dialog";
import CreateCollectionDialog from "../dialog/create-collection/create-collection-dialog";

import DeleteCollectionAlertDialog from "../dialog/delete-collection-alert/delete-collection-alert-dialog";
import EditCollectionDialog from "../dialog/edit-collection/edit-collection-dialog";
import { CollectionsProvider } from "./collections-context";
import CollectionsList from "./collections-list";

type Props = {
    params: Promise<{ link: string }>;
}

export default async function CollectionsSection({ params }: Props) {
    const { link } = await params;

    const profile = await fetchProfileByLink(link).catch(() => {
        return undefined;
    });

    if (!profile) return null;

    const [collections, collectionsItems] = await Promise.all([
        fetchCollections(profile).catch(() => {
            return [];
        }),
        fetchCollectionsItems(profile, 10).catch(() => {
            return [];
        })
    ]);

    return (
        <CollectionsProvider collections={collections} itemBatches={collectionsItems}>
            <div className="flex flex-col gap-4">
                <CollectionsList isUserAuthorized={profile.isAuthorized} />
                {profile.isAuthorized && <CollectionHeaderLine leftSide={<CreateCollectionTitleButton />} />}
                <CreateCollectionDialog />
                <DeleteCollectionAlertDialog />
                <AddCollectionItemDialog />
                <EditCollectionDialog />
            </div>
        </CollectionsProvider>
    )
}
