"use client";

import { useParams } from "next/navigation";
import QueryPanel from "@/components/QueryPanel";

export default function QueryPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col h-full bg-warm-primary overflow-y-auto">
      <div className="flex-1 w-full max-w-[760px] mx-auto py-16 px-6">
        <QueryPanel repoId={id} />
      </div>
    </div>
  );
}
