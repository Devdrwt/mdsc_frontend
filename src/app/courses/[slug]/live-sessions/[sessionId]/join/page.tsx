'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import LiveSessionPlayer from '../../../../../../components/live/LiveSessionPlayer';

export default function JoinLiveSessionPage() {
  const params = useParams();
  const slug = params.slug as string;
  const sessionId = parseInt(params.sessionId as string);

  return (
    <LiveSessionPlayer
      sessionId={sessionId}
      courseSlug={slug}
    />
  );
}

