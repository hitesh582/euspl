// Types for Google Vision API responses
interface TextAnnotation {
  text: string;
  locales?: string[];
}

interface VisionApiResponse {
  responses: Array<{
    fullTextAnnotation?: TextAnnotation;
    textAnnotations?: Array<{
      text: string;
      locale?: string;
      description?: string;
    }>;
  }>;
}

/**
 * Extract text from image using Google Vision API
 */
export async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    // Get API key from environment
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY
    
    if (!apiKey) {
      throw new Error('Google Vision API key not found. Please set NEXT_PUBLIC_GOOGLE_VISION_API_KEY environment variable.');
    }

    // Convert file to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Prepare request payload
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1
            }
          ]
        }
      ]
    };

    // Make API request
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Vision API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data: VisionApiResponse = await response.json();
    
    // Extract text from response
    if (data.responses?.[0]?.fullTextAnnotation?.text) {
      return data.responses[0].fullTextAnnotation.text;
    }
    
    // Fallback to textAnnotations if fullTextAnnotation is not available
    if (data.responses?.[0]?.textAnnotations?.[0]?.description) {
      return data.responses[0].textAnnotations[0].description;
    }
    
    throw new Error('No text found in the image');
    
  } catch (error) {
    console.error('Vision API error:', error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert file to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Batch process multiple images
 */
export async function extractTextFromMultipleImages(imageFiles: File[]): Promise<string[]> {
  const promises = imageFiles.map(file => extractTextFromImage(file));
  return Promise.all(promises);
}
