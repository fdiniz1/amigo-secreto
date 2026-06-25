import nodemailer from "nodemailer";

export interface MailDrawPair {
  giverName: string;
  giverEmail: string;
  receiverName: string;
}

type ResendResponse = {
  id?: string;
  name?: string;
  message?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getOptionalEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

function createTransporter() {
  const host = getOptionalEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || 587);
  const user = getOptionalEnv("SMTP_USER");
  const pass = getOptionalEnv("SMTP_PASS");

  if (!host || !user || !pass) {
    throw new Error(
      "Configuracao SMTP incompleta. Defina SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS.",
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

function buildEmailText(pair: MailDrawPair): string {
  return [
    `Ola, ${pair.giverName}!`,
    "",
    "O sorteio do amigo secreto foi realizado com sucesso.",
    `Voce deve presentear: ${pair.receiverName}`,
    "",
    "Boa brincadeira!",
  ].join("\n");
}

function buildEmailHtml(pair: MailDrawPair): string {
  const giverName = escapeHtml(pair.giverName);
  const receiverName = escapeHtml(pair.receiverName);

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Amigo Secreto</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f3f4f6;">
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="background-color:#f3f4f6; margin:0; padding:24px 12px;"
        >
          <tr>
            <td align="center">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  max-width:520px;
                  background:#ffffff;
                  border-radius:12px;
                  padding:32px;
                  font-family:Arial, Helvetica, sans-serif;
                "
              >
                <tr>
                  <td>
                    <h1
                      style="
                        margin:0 0 16px;
                        font-size:24px;
                        line-height:32px;
                        color:#0f766e;
                      "
                    >
                      Amigo Secreto
                    </h1>

                    <p
                      style="
                        margin:0 0 12px;
                        font-size:16px;
                        line-height:24px;
                        color:#111827;
                      "
                    >
                      Ola, <strong>${giverName}</strong>!
                    </p>

                    <p
                      style="
                        margin:0 0 12px;
                        font-size:16px;
                        line-height:24px;
                        color:#111827;
                      "
                    >
                      O sorteio do amigo secreto foi realizado com sucesso.
                    </p>

                    <p
                      style="
                        margin:24px 0;
                        font-size:18px;
                        line-height:28px;
                        color:#111827;
                      "
                    >
                      Voce deve presentear:
                      <strong style="color:#2563eb;">${receiverName}</strong>
                    </p>

                    <p
                      style="
                        margin:0;
                        font-size:14px;
                        line-height:22px;
                        color:#6b7280;
                      "
                    >
                      Boa brincadeira!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

async function sendEmailWithResend(pair: MailDrawPair, apiKey: string): Promise<void> {
  const from = getOptionalEnv("MAIL_FROM") || getOptionalEnv("SMTP_FROM");

  if (!from) {
    throw new Error("Defina MAIL_FROM para enviar e-mails pela Resend.");
  }

  const replyTo = getOptionalEnv("MAIL_REPLY_TO") || getOptionalEnv("SMTP_REPLY_TO");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "amigo-secreto/1.0",
    },
    body: JSON.stringify({
      from,
      to: pair.giverEmail,
      subject: "Seu amigo secreto foi sorteado 🎁",
      text: buildEmailText(pair),
      html: buildEmailHtml(pair),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as ResendResponse;

  if (!response.ok) {
    const details = data.message || data.name || response.statusText;
    throw new Error(`Falha ao enviar e-mail pela Resend (${response.status}): ${details}`);
  }

  console.log(`[email] Resend enviou ${data.id ?? "mensagem"} para ${pair.giverEmail}`);
}

async function sendEmailsWithResend(pairs: MailDrawPair[], apiKey: string): Promise<void> {
  const results = await Promise.allSettled(
    pairs.map((pair) => sendEmailWithResend(pair, apiKey)),
  );

  const failedResults = results.filter((result) => result.status === "rejected");

  for (const result of failedResults) {
    console.error("[email] Falha individual no envio pela Resend", result.reason);
  }

  if (failedResults.length > 0) {
    throw new Error(
      `Falha ao enviar ${failedResults.length} de ${pairs.length} e-mail(s) pela Resend.`,
    );
  }
}

async function sendEmailsWithSmtp(pairs: MailDrawPair[]): Promise<void> {
  const transporter = createTransporter();

  await transporter.verify();

  const from =
    getOptionalEnv("SMTP_FROM") || "Amigo Secreto <no-reply@amigosecreto.local>";
  const replyTo = getOptionalEnv("SMTP_REPLY_TO") || from;

  const results = await Promise.allSettled(
    pairs.map(async (pair) => {
      const info = await transporter.sendMail({
        from,
        replyTo,
        to: pair.giverEmail,
        subject: "Seu amigo secreto foi sorteado 🎁",
        text: buildEmailText(pair),
        html: buildEmailHtml(pair),
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);

      if (previewUrl) {
        console.log(`[email] Preview para ${pair.giverEmail}: ${previewUrl}`);
      } else {
        console.log(`[email] E-mail enviado para ${pair.giverEmail}`);
      }
    }),
  );

  const failedResults = results.filter((result) => result.status === "rejected");

  for (const result of failedResults) {
    console.error("[email] Falha individual no envio SMTP", result.reason);
  }

  if (failedResults.length > 0) {
    throw new Error(
      `Falha ao enviar ${failedResults.length} de ${pairs.length} e-mail(s) por SMTP.`,
    );
  }
}

export async function sendDrawEmails(pairs: MailDrawPair[]): Promise<void> {
  if (!pairs.length) return;

  const resendApiKey = getOptionalEnv("RESEND_API_KEY");

  if (resendApiKey) {
    await sendEmailsWithResend(pairs, resendApiKey);
    return;
  }

  await sendEmailsWithSmtp(pairs);
}
