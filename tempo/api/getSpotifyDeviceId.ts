import { LivePaceRunResponse } from "./types";
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export interface Device {
  id: string;
  is_active: boolean;
  name: string;
  type: string;
}

export async function getActiveDeviceId(accessToken: string): Promise<string | null> {
  const response = await fetch(`${SPOTIFY_API_BASE}/me/player/devices`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch devices:', response.status);
    return null;
  }

  const data = await response.json();

  const activeDevice = data.devices.find((d: Device) => d.is_active);

  if (activeDevice) {
    return activeDevice.id;
  } else if (data.devices.length > 0) {
    
    return data.devices[0].id;
  }

  return null;
}