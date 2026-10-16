import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { STORIES } from "@/lib/stories/library";

export async function ensureStories() {
  const admin = createAdminClient();
  await admin.from("stories").upsert(
    STORIES.map((story) => ({
      family_id: null,
      slug: story.slug,
      title_fr: story.title_fr,
      title_en: story.title_en,
      pages: story.pages,
    })),
    { onConflict: "slug" },
  );
}
