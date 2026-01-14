import ItemDetail from "@/components/ItemDetail";

export default function RoadmapItemDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <ItemDetail id={params.id} />;
}

