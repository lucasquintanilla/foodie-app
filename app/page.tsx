import { ServicesMarketplace } from "@/components/services-marketplace"
import { getActiveServices } from "@/lib/services/server"

export default async function Page() {
  const { services } = await getActiveServices()
  return <ServicesMarketplace services={services} isPrivatePreview />
}
