import { redirect } from "next/navigation"

export default async function PharmacyInventoryEditRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/pharmacy/medicines/${id}/edit`)
}

