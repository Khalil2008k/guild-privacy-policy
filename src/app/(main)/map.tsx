import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';

export default function MapRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if this screen is accessed directly
    // Don't redirect if user navigated here intentionally
    if (pathname === '/(main)/map') {
      router.replace('/(modals)/guild-map');
    }
  }, [pathname]);

  return null;
}

