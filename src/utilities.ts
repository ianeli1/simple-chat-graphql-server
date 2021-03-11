import axios from "axios";

export const alertDiscord = (message: string) => {
  const { DISCORD_WEBHOOK } = process.env;
  if (!DISCORD_WEBHOOK) {
    throw new Error("No Discord webhook was supplied!!!");
  }

  const content = `ALERT:
  ${message}`;
  axios.post(DISCORD_WEBHOOK, { content });
  console.warn("An action was reported.");
};
