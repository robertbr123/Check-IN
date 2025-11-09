import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface SendQRCodeEmailParams {
  to: string
  participantName: string
  eventName: string
  eventLocation?: string
  eventDate?: Date
  qrCodeDataUrl: string
}

export async function sendQRCodeEmail({
  to,
  participantName,
  eventName,
  eventLocation,
  eventDate,
  qrCodeDataUrl,
}: SendQRCodeEmailParams) {
  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "A definir"

  // Converte Data URL para Buffer
  const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "")
  const qrCodeBuffer = Buffer.from(base64Data, "base64")

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu QR Code para ${eventName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      width: 60px;
      height: 60px;
      background-color: white;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 15px;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 10px;
    }
    .event-info {
      background-color: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .event-info h2 {
      color: #1e40af;
      margin: 0 0 15px 0;
      font-size: 20px;
    }
    .info-item {
      display: flex;
      margin-bottom: 10px;
      color: #475569;
    }
    .info-label {
      font-weight: 600;
      margin-right: 8px;
      color: #1e293b;
    }
    .qr-section {
      text-align: center;
      padding: 30px 0;
      background-color: #f8fafc;
      border-radius: 8px;
      margin: 25px 0;
    }
    .qr-section h3 {
      color: #1e293b;
      margin-bottom: 15px;
    }
    .qr-code {
      display: inline-block;
      padding: 20px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .qr-code img {
      max-width: 250px;
      height: auto;
      display: block;
    }
    .instructions {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .instructions h4 {
      color: #92400e;
      margin: 0 0 10px 0;
    }
    .instructions ul {
      margin: 0;
      padding-left: 20px;
      color: #78350f;
    }
    .instructions li {
      margin-bottom: 5px;
    }
    .footer {
      background-color: #1e293b;
      color: #cbd5e1;
      text-align: center;
      padding: 25px 20px;
      font-size: 14px;
    }
    .footer strong {
      color: white;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="9" y2="9"></line>
          <line x1="15" y1="9" x2="15" y2="9"></line>
          <line x1="9" y1="15" x2="9" y2="15"></line>
          <line x1="15" y1="15" x2="15" y2="15"></line>
        </svg>
      </div>
      <h1>Checkin Linket</h1>
    </div>

    <div class="content">
      <p class="greeting">Olá, <strong>${participantName}</strong>!</p>
      
      <p>Você foi cadastrado(a) com sucesso no evento e seu QR Code está pronto! 🎉</p>

      <div class="event-info">
        <h2>📅 Informações do Evento</h2>
        <div class="info-item">
          <span class="info-label">Evento:</span>
          <span>${eventName}</span>
        </div>
        ${
          eventLocation
            ? `
        <div class="info-item">
          <span class="info-label">Local:</span>
          <span>${eventLocation}</span>
        </div>
        `
            : ""
        }
        <div class="info-item">
          <span class="info-label">Data:</span>
          <span>${formattedDate}</span>
        </div>
      </div>

      <div class="qr-section">
        <h3>🎫 Seu QR Code Pessoal</h3>
        <div class="qr-code">
          <img src="cid:qrcode" alt="QR Code" style="max-width: 250px; height: auto; display: block;" />
        </div>
      </div>

      <div class="instructions">
        <h4>📋 Instruções Importantes:</h4>
        <ul>
          <li>Salve este e-mail ou imprima o QR Code</li>
          <li>Apresente o QR Code na entrada do evento</li>
          <li>Você pode usar o QR Code direto do celular</li>
          <li>Não compartilhe seu QR Code com outras pessoas</li>
        </ul>
      </div>

      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        Em caso de dúvidas, entre em contato com a organização do evento.
      </p>
    </div>

    <div class="footer">
      <strong>Checkin Linket</strong><br>
      Sistema de Gerenciamento de Check-in para Eventos<br>
      © ${new Date().getFullYear()} Todos os direitos reservados
    </div>
  </div>
</body>
</html>
  `

  const textContent = `
Olá, ${participantName}!

Você foi cadastrado(a) com sucesso no evento!

INFORMAÇÕES DO EVENTO:
- Evento: ${eventName}
${eventLocation ? `- Local: ${eventLocation}` : ""}
- Data: ${formattedDate}

Seu QR Code pessoal foi gerado e está anexado neste e-mail.

INSTRUÇÕES:
- Salve este e-mail ou imprima o QR Code
- Apresente o QR Code na entrada do evento
- Você pode usar o QR Code direto do celular
- Não compartilhe seu QR Code com outras pessoas

Em caso de dúvidas, entre em contato com a organização do evento.

---
Checkin Linket
Sistema de Gerenciamento de Check-in para Eventos
  `

  const mailOptions = {
    from: {
      name: "Check-IN System",
      address: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@checkin.com",
    },
    to,
    subject: `🎫 Seu QR Code para ${eventName}`,
    text: textContent,
    html: htmlContent,
    attachments: [
      {
        filename: "qrcode.png",
        content: qrCodeBuffer,
        cid: "qrcode", // Content-ID para usar no HTML como cid:qrcode
      },
    ],
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Email enviado:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    throw new Error("Falha ao enviar email")
  }
}

export async function verifyEmailConfig() {
  try {
    await transporter.verify()
    return { success: true, message: "Configuração de email válida" }
  } catch (error) {
    console.error("Erro na configuração de email:", error)
    return { success: false, message: "Configuração de email inválida" }
  }
}
