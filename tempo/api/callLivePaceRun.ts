import { LivePaceRunRequest, LivePaceRunResponse } from './types';
import { Alert } from 'react-native';

const FLASK_API_BASE_URL = 'https://practiceusernameforjosh.pythonanywhere.com';
const TIMEOUT_MS = 60000;

export async function callLivePaceRun(
    requestBody: LivePaceRunRequest
): Promise<LivePaceRunResponse> {


    const url = `${FLASK_API_BASE_URL}/api/live-pace-run`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const finalRequestBody: LivePaceRunRequest = {
        ...requestBody,

    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(finalRequestBody),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.status === 401) {
            const errorText = await response.text();


            throw new Error(`Authentication Expired! Status: 401, Details: ${errorText}`);
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }

        const data: LivePaceRunResponse = await response.json();
        return data;

    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
            Alert.alert("Request Timed Out", "The live run setup took too long. Check your network or try again.");
        }

        console.error("Error starting live pace run: ", error);
        throw error;
    }
}