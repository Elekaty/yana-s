import { EmptyState } from "@/components/parent/screen-state";

export const dynamic = "force-dynamic";

export default function VoicePage() {
  return <EmptyState title="Voice" body="No recordings yet. They show up when Yana records in Say it." />;
}
