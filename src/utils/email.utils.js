import nodemailer from "nodemailer";

const sendEmail = async ({ email, subject, message }) => {
    try {
        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Email options
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: email,
            subject,
            text: message,
            html: `<div>${message}</div>`
        };

        // Send email
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email");
    }
};

export { sendEmail }; 