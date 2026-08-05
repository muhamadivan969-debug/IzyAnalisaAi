export async function askOpenAI(message: string, context?: any): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("NO_OPENAI_KEY");

  const systemPrompt = `You are IzyAnalisaAI assistant. Provide concise, helpful trading analysis and explanations in Indonesian. Be factual, avoid hallucination, and keep responses short (2-6 sentences) unless the user asks for more.`;

  const userContent = context ? `${message}\n\nContext:\n${JSON.stringify(context)}` : message;

  const payload = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ],
    max_tokens: 400,
    temperature: 0.2,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
    // Let caller handle timeouts; Node/Next has default fetch timeouts depending on runtime
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const reply = json?.choices?.[0]?.message?.content;
  return reply || "";
}
