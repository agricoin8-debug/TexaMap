import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import MapDashboard from '@/components/dashboard/MapDashboard'

export default async function Home() {
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')
  return <MapDashboard operatorName={session.user.name || session.user.email} />
}
