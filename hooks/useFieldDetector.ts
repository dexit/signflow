import { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { FieldType } from '../types';

// Define a subset of field types for better AI accuracy
const DETECTABLE_FIELD_TYPES = [
    FieldType.SIGNATURE,
    FieldType.INITIALS,
    FieldType.TEXT,
    FieldType.NAME,
    FieldType.DATE,
    FieldType.CHECKBOX,
];

// Define the expected structure of a single field from the AI
export interface DetectedField {
  type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Define the JSON schema for the AI's response
const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: DETECTABLE_FIELD_TYPES,
        description: 'The type of the form field.',
      },
      page: {
        type: Type.INTEGER,
        description: 'The 0-indexed page number where the field is located.',
      },
      x: {
        type: Type.INTEGER,
        description: 'The x-coordinate of the top-left corner of the field bounding box, in pixels.',
      },
      y: {
        type: Type.INTEGER,
        description: 'The y-coordinate of the top-left corner of the field bounding box, in pixels.',
      },
      width: {
        type: Type.INTEGER,
        description: 'The width of the field bounding box, in pixels.',
      },
      height: {
        type: Type.INTEGER,
        description: 'The height of the field bounding box, in pixels.',
      },
    },
    required: ['type', 'page', 'x', 'y', 'width', 'height'],
  },
};

const PROMPT = `
You are a document analysis expert. Analyze the following document pages and identify all common form fields.
Look for lines, boxes, and text that indicate a place for a signature, initials, date, name, or general text input.
For each field you find, provide its location and type. The coordinates should be in pixels, relative to the top-left corner of each image.
'x' and 'y' are the top-left corner of the bounding box. 'width' and 'height' are its dimensions.
The page number is 0-indexed. Only identify the following field types: ${DETECTABLE_FIELD_TYPES.join(', ')}.
Respond ONLY with a JSON object that adheres to the provided schema. If no fields are found, return an empty array.
`;

export const useFieldDetector = () => {
    const [isDetecting, setIsDetecting] = useState(false);

    const detectFields = async (pageImages: string[]): Promise<DetectedField[] | null> => {
        setIsDetecting(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const imageParts = pageImages.map(imgData => ({
                inlineData: {
                    mimeType: 'image/png',
                    data: imgData.split(',')[1] // remove data:image/png;base64, prefix
                }
            }));
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: PROMPT }, ...imageParts] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                }
            });

            const jsonStr = response.text.trim();
            const detectedFields: DetectedField[] = JSON.parse(jsonStr);
            
            // Basic validation
            if (!Array.isArray(detectedFields)) {
                throw new Error("AI response is not a valid array.");
            }
            
            return detectedFields;
        } catch (error) {
            console.error("Error detecting fields with Gemini API:", error);
            // In a real app, you might want to show this error to the user.
            alert("Failed to detect fields. Please check the console for more details.");
            return null;
        } finally {
            setIsDetecting(false);
        }
    };

    return { isDetecting, detectFields };
};
