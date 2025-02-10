import CollectionLine from "@/components/view/content-collections/collection-line";
import ContentCollection from "@/components/view/content-collections/content-collection";
import CreateCollectionButton from "@/components/view/content-collections/create-collection-button";
import { fetchCollections, fetchProfileByLink } from "@/hooks/api-endpoints-server";
import getUser from "@/hooks/getUser";

type Props = {
    params: Promise<{ link: string }>;
}

export default async function CollectionsSection({ params }: Props) {
    const { link } = await params;

    const profile = await fetchProfileByLink(link);
    const user = await getUser();
    const isUserAuthorized = profile?.id === user?.id;
    const collections = await fetchCollections(profile);

    return (
        <>
            {collections.map((collection) => (
                <ContentCollection key={collection.id} collection={collection} />
            ))}
            {isUserAuthorized && <CollectionLine leftSide={<CreateCollectionButton />} />}
        </>
    )
}
