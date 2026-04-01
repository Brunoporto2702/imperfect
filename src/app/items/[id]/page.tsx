import { EditItemPage } from "@/client/pages/EditItemPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditItemPage id={id} />;
}
