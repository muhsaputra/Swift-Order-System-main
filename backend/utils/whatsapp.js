// utils/whatsapp.js
const sendWhatsAppMessage = async (target, message) => {
  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: process.env.FONNTE_API_TOKEN,
      },
      body: new URLSearchParams({
        target: target,
        message: message,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("WhatsApp Gateway Error:", error);
    throw error;
  }
};

module.exports = { sendWhatsAppMessage };
