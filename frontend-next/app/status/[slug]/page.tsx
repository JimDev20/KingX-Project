import PublicStatusPage from '../../../components/PublicStatusPage'

export default async function StatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <PublicStatusPage slug={slug} />
}
