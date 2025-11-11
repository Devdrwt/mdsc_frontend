import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardInstructorCourseRedirect({ params, searchParams }: PageProps) {
  const { courseId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const query = new URLSearchParams();

  if (resolvedSearchParams) {
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        query.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((val) => query.append(key, val));
      }
    });
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  redirect(`/instructor/courses/${courseId}${suffix}`);
}
