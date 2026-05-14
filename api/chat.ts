import OpenAI from 'openai';

// Vercel Edge Runtime을 사용하면 응답 속도가 빠릅니다.
export const config = {
  runtime: 'edge',
};

const SYSTEM_PROMPT = `당신은 "영어 단어 퀴즈 챗봇"입니다.
사용자가 원하는 주제나 난이도를 입력하면 관련 영어 단어를 알려주고 짧은 복습 퀴즈를 내줍니다.

규칙:
1. 답변은 한국어로 합니다.
2. 영어 단어는 한 번에 최대 3개만 알려줍니다.
3. 각 단어에는 뜻과 짧은 예문을 함께 보여줍니다.
4. 답변은 5문장 이내로 합니다.
5. 마지막에는 복습 퀴즈를 1개만 내줍니다.
6. 사용자가 주제나 난이도를 말하지 않으면 먼저 친절하게 물어봅니다.`;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
    });

    return new Response(JSON.stringify(response.choices[0].message), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in API:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
