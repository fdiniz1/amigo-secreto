import nodemailer from "nodemailer";

export interface MailDrawPair {
  giverName: string;
  giverEmail: string;
  receiverName: string;
}

type MailProvider = "resend" | "smtp";

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

function getMailProvider(): MailProvider {
  const provider = process.env.MAIL_PROVIDER?.trim().toLowerCase();

  if (provider === "resend" || provider === "smtp") {
    return provider;
  }

  if (provider) {
    throw new Error("MAIL_PROVIDER deve ser 'resend' ou 'smtp'.");
  }

  return process.env.RESEND_API_KEY ? "resend" : "smtp";
}

function getRequiredEnv(key: string): string {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${key}.`);
  }

  return value;
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

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

async function sendEmailWithResend(pair: MailDrawPair): Promise<void> {
  const apiKey = getRequiredEnv("RESEND_API_KEY");
  const from = process.env.MAIL_FROM || process.env.SMTP_FROM;

  if (!from) {
    throw new Error("Defina MAIL_FROM para enviar e-mails pela Resend.");
  }

  const replyTo = process.env.MAIL_REPLY_TO || process.env.SMTP_REPLY_TO;

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
      subject: "Seu amigo secreto foi sorteado",
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

async function sendEmailsWithSmtp(pairs: MailDrawPair[]): Promise<void> {
  const transporter = createTransporter();

  await transporter.verify();

  const from =
    process.env.SMTP_FROM || "Amigo Secreto <no-reply@amigosecreto.local>";
  const replyTo = process.env.SMTP_REPLY_TO || from;

  await Promise.all(
    pairs.map(async (pair) => {
      const info = await transporter.sendMail({
        from,
        replyTo,
        to: pair.giverEmail,
        subject: "Seu amigo secreto foi sorteado",
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
}

export async function sendDrawEmails(pairs: MailDrawPair[]): Promise<void> {
  if (!pairs.length) return;

  const provider = getMailProvider();

  if (provider === "smtp") {
    await sendEmailsWithSmtp(pairs);
    return;
  }

  await Promise.all(pairs.map((pair) => sendEmailWithResend(pair)));
}
