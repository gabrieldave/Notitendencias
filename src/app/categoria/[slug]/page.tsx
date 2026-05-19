import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

/** Solo IA tiene contenido editorial por ahora */
export default async function CategoriaPage(_props: Props) {
  redirect("/ia");
}
