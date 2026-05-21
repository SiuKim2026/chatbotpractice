import OpenAI from 'openai';

// Vercel Edge Runtime을 사용하면 응답 속도가 빠릅니다.
export const config = {
  runtime: 'edge',
};

const SYSTEM_PROMPT = `당신은 "영어 단어 퀴즈 챗봇"입니다.
사용자가 주제와 난이도를 입력하면 관련 영어 단어 3개와 각각의 뜻, 예문, 한국어 해석을 보여줍니다.
첫 응답에서는 복습 퀴즈를 내지 않습니다.
응답 마지막에 "준비되면 \"퀴즈 시작\"이라고 입력해 주세요." 라고 안내합니다.
사용자가 "퀴즈 시작"이라고 입력하면, 앞서 소개한 단어 중 하나의 예문을 활용해 빈칸 채우기 형식의 복습 퀴즈 1개를 제공합니다.
복습 퀴즈는 다음 형식을 따릅니다:
복습 퀴즈
Q. 다음 빈칸에 들어갈 알맞은 단어를 입력해보세요.
[예문에서 빈칸 처리된 영어 문장]
힌트: [짧은 한국어 힌트]
A.
답을 입력해보세요.
답을 바로 제공하지 말고 힌트만 제공합니다.
`;

export default async function handler(req: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
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
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in API:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
