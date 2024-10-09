import { NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Add this new function to set CORS headers
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', '*');
  response.headers.set('Access-Control-Allow-Headers', '*');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export async function POST(req: Request) {
  let messages: any[] = [];
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const body = await req.json();
      const { input, image } = body;
      
      if (input) {
        console.log('Received text problem:', input);
        messages.push({ role: "user", content: input });
      }
      
      if (image) {
        console.log('Received image data');
        // Assuming the image is already a base64 string
        messages.push({
          role: "user",
          content: [
            { type: "text", text: "Solve the math problem in this image and explain the solution step by step." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } }
          ]
        });
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return NextResponse.json({ error: 'Invalid JSON input' }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
  }

  if (messages.length === 0) {
    return NextResponse.json({ error: 'No input or image provided' }, { status: 400 });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: messages,
      max_tokens: 300,
    });

    const solution = response.choices[0].message.content;

    return setCorsHeaders(NextResponse.json({ solution }));
  } catch (error: any) { // Add ': any' here
    console.error('Error in solve-math API:', error);
    return setCorsHeaders(NextResponse.json({ 
      error: 'Failed to solve math problem', 
      details: error.message || 'Unknown error'
    }, { status: 500 }));
  }
}

export async function GET(req: Request) {
  return setCorsHeaders(NextResponse.json({ message: "GET method is supported" }));
}

export async function OPTIONS(req: Request) {
  return setCorsHeaders(NextResponse.json({}));
}