import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendHeatingAlert(subject: string, body: string) {
  const to = process.env.ALERT_EMAIL;
  if (!to) {
    console.error("ALERT_EMAIL is not set, skipping email alert");
    return;
  }

  await getResend().emails.send({
    from: "Coliving Barbusse <onboarding@resend.dev>",
    to,
    subject: `[Chauffage Coliving] ${subject}`,
    text: body,
  });
}

export async function sendWaterHeaterAlert(subject: string, body: string) {
  const to = process.env.ALERT_EMAIL;
  if (!to) {
    console.error("ALERT_EMAIL is not set, skipping email alert");
    return;
  }

  await getResend().emails.send({
    from: "Coliving Barbusse <onboarding@resend.dev>",
    to,
    subject: `[ECS Coliving] ${subject}`,
    text: body,
  });
}
