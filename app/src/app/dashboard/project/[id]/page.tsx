import { redirect } from 'next/navigation';

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  redirect(`/dashboard/project/${id}/privacy`);
}
