import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function MapRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new GUILD Map screen
    router.replace('/(modals)/guild-map');
  }, []);

  return null;
}

