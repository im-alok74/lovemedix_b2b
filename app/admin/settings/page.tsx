import prisma from '@/lib/prisma'
import { PageHeading, Card } from '@/components/dashboard/ui'
import { SettingsForm } from '@/components/admin/settings-form'

export const metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const settings = await prisma.platformSetting.findMany({ orderBy: { key: 'asc' } })
  return (
    <div className="max-w-2xl">
      <PageHeading title="Platform settings" description="Marketplace-wide configuration." />
      <Card className="p-5">
        <SettingsForm
          settings={settings.map((s) => ({ key: s.key, value: s.value, type: s.type, description: s.description }))}
        />
      </Card>
    </div>
  )
}
