const BASE_URL = 'https://practiceusernameforjosh.pythonanywhere.com/api';


export async function callPausePlayback(accessToken: string): Promise<boolean> {
  const response = await fetch(`${BASE_URL}/pause-playback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access_token: accessToken }),
  });
  
  if (!response.ok) {
  
    throw new Error(`Pause failed with status: ${response.status}`);
  }
  return true;
}


export async function callSkipNext(accessToken: string): Promise<boolean> {
  const response = await fetch(`${BASE_URL}/skip-next`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access_token: accessToken }),
  });
  
  if (!response.ok) {
    throw new Error(`Skip next failed with status: ${response.status}`);
  }
  return true;
}


export async function callSkipPrevious(accessToken: string): Promise<boolean> {
  const response = await fetch(`${BASE_URL}/skip-previous`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access_token: accessToken }),
  });
  
  if (!response.ok) {
    throw new Error(`Skip previous failed with status: ${response.status}`);
  }
  return true;
}