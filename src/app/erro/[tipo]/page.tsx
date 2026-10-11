import { notFound } from "next/navigation";
import { isErrorKind } from "@/lib/errors";
import ErrorScreen from "@/components/ErrorScreen";
export const metadata = { title: "Precisamos da sua atenção", robots: { index: false, follow: false } };
export default async function ErrorPage(props: { params: Promise<{ tipo: string }> }) {
  const params = await props.params;
  if (!isErrorKind(params.tipo)) notFound();
  return <ErrorScreen kind={params.tipo} />;
}


