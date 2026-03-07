import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'dentalclubibagues@gmail.com',
    pass: process.env.EMAIL_PASS,
  },
});

const EMAIL_USER = process.env.EMAIL_USER || 'dentalclubibagues@gmail.com';
const URL_FRONTEND = process.env.URL_FRONTEND;

// Cliente - Confirmación pago
export async function sendOrderConfirmation(order: any) {
  await transporter.sendMail({
    from: `"Dental Club Ibagué" <${EMAIL_USER}>`,
    to: order.customerEmail,
    subject: `✅ Pedido #${order.id.slice(-8)} confirmado`,
    html: `
      <h1>¡Pago recibido! #${order.id.slice(-8)}</h1>
      <p><strong>Total:</strong> $${order.total.toLocaleString('es-CO')}</p>
      <p><strong>Estado:</strong> ${order.status}</p>
      <p><strong>Envío:</strong> ${order.shipAddress}, ${order.shipCity}</p>
      <small>📦 Guía en 24h</small>
    `,
  });
}

// Cliente - Pago fallido
export async function sendOrderFailed(order: any) {
  await transporter.sendMail({
    from: `"Dental Club Ibagué" <${EMAIL_USER}>`,
    to: order.customerEmail,
    subject: `❌ Pedido #${order.id.slice(-8)} - Pago fallido`,
    html: `
      <h1>Pago fallido #${order.id.slice(-8)}</h1>
      <p>Intenta nuevamente o contacta <a href="mailto:${EMAIL_USER}">soporte</a>.</p>
    `,
  });
}

// ADMIN - Nuevo pago
export async function sendAdminNewPayment(order: any) {
  await transporter.sendMail({
    from: `"Dental Club" <${EMAIL_USER}>`,
    to: `${EMAIL_USER}`,
    subject: `🦷 💰 NUEVO PAGO #${order.id.slice(-8)} $${order.total}`,
    html: `
      <h2>Nuevo pago recibido</h2>
      <p><strong>Pedido:</strong> #${order.id.slice(-8)}</p>
      <p><strong>Cliente:</strong> ${order.customerName} ${order.customerLastName}</p>
      <p><strong>Email:</strong> ${order.customerEmail}</p>
      <p><strong>Tel:</strong> ${order.customerPhone}</p>
      <p><strong>Documento:</strong> ${order.customerDocumentType} ${order.customerDocument}</p>
      <p><strong>Total:</strong> $${order.total.toLocaleString()}</p>
      <a href="${URL_FRONTEND}/pedido/${order.id}">→ Ver Admin</a>
    `,
  });
}

// ADMIN - Guía creada
export async function sendAdminNewShipment(order: any) {
  await transporter.sendMail({
    from: `"Dental Club" <${EMAIL_USER}>`,
    to: `${EMAIL_USER}`,
    subject: `📦 GUIA CREADA #${order.id.slice(-8)} ${order.carrier}`,
    html: `
      <h2>¡Nueva guía generada!</h2>
      <p><strong>Pedido:</strong> #${order.id.slice(-8)}</p>
      <p><strong>Cliente:</strong> ${order.customerName}</p>
      <p><strong>Guía:</strong> ${order.trackingNumber}</p>
      <p><strong>Transportadora:</strong> ${order.carrier}</p>
      <a href="${URL_FRONTEND}/pedido/${order.id}">→ Admin</a>
    `,
  });
}

// CLIENTE - Guía creada
export async function sendCustomerShipment(order: any) {
  await transporter.sendMail({
    from: `"Dental Club Ibagué" <${EMAIL_USER}>`,
    to: order.customerEmail,
    subject: `📦 Tu guía del pedido #${order.id.slice(-8)} está lista`,
    html: `
      <h1>¡Tu envío está en camino!</h1>
      <p><strong>Guía:</strong> <strong>${order.trackingNumber}</strong></p>
      <p><strong>Transportadora:</strong> ${order.carrier}</p>`,
  });
}
