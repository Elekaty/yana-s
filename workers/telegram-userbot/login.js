require("dotenv").config();

const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

async function ask(rl, label) {
  const answer = await rl.question(label);
  return answer.trim();
}

async function main() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH || "";
  if (!apiId || !apiHash) {
    console.error("Set TELEGRAM_API_ID and TELEGRAM_API_HASH first.");
    process.exit(1);
  }
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const client = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });
  await client.start({
    phoneNumber: () => ask(rl, "Phone number with country code: "),
    password: async () => ask(rl, "Two-step password, or press Enter: "),
    phoneCode: () => ask(rl, "Code from Telegram: "),
    onError: (error) => console.error(error.message || "login failed"),
  });
  console.log("\nTELEGRAM_SESSION_STRING=");
  console.log(client.session.save());
  console.log("\nPut that value in the host. Do not commit it.");
  await client.disconnect();
  rl.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "login stopped");
  process.exit(1);
});
