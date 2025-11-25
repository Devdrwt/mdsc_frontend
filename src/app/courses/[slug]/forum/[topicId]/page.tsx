"use client";

import { useParams } from "next/navigation";
import { AuthGuard } from "../../../../../lib/middleware/auth";
import DashboardLayout from "../../../../../components/layout/DashboardLayout";
import TopicDetail from "../../../../../components/forum/TopicDetail";

export default function TopicDetailPage() {
  const params = useParams();
  const topicId = parseInt(params.topicId as string, 10);

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="max-w-4xl mx-auto">
          <TopicDetail topicId={topicId} />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

