import { redirect } from "next/navigation";
import { kidPlaces } from "@/lib/kid/places";

export default function MoreGamesPage() {
  redirect(kidPlaces.bay);
}
