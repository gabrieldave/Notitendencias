import { redirect } from "next/navigation";

/** Alias legado: el radar editorial vive en /ia */
export default function RadarAliasPage() {
  redirect("/ia");
}
