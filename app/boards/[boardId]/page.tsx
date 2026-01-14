import ItemList from "@/components/ItemList";

export default function BoardPage({
  params
}: {
  params: { boardId: string };
}) {
  return (
    <main className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="text-base font-semibold">板块详情</div>
        <div className="mt-1 text-sm text-zinc-400">
          在此板块下添加条目，填写优先级、排期、需求来源与描述图。
        </div>
      </div>
      <ItemList boardId={params.boardId} />
    </main>
  );
}

