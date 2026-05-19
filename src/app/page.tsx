import { redirect } from "next/navigation";

/** Por ahora el producto editorial vive en IA */
export default function HomePage() {
  redirect("/ia");
}
