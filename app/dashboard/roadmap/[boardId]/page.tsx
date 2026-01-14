import { redirect } from "next/navigation";

export default function RoadmapBoardPage({
  params
}: {
  params: { boardId: string };
}) {
  redirect("/dashboard/roadmap");
}

