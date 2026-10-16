// Cloudflare Email Routing worker. Keep this small: the free plan allows about 10ms of CPU.
// Set INTAKE_URL to https://YOUR-APP.vercel.app/api/intake/email
// Set INBOUND_EMAIL_SECRET to the same value as the app.
const worker = {
  async email(message, env) {
    const reader = message.raw.getReader();
    const chunks = [];
    let size = 0;
    while (size < 200_000) {
      const step = await reader.read();
      if (step.done) break;
      chunks.push(step.value);
      size += step.value.length;
    }
    const raw = new TextDecoder().decode(concat(chunks));
    await fetch(env.INTAKE_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.INBOUND_EMAIL_SECRET}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: message.from,
        to: message.to,
        subject: message.headers.get("subject") ?? "",
        messageId: message.headers.get("message-id") ?? "",
        raw,
      }),
    });
  },
};

export default worker;

function concat(chunks) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}
