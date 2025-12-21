import nodemailer from 'nodemailer';

const ADMIN_EMAIL = 'parthsavaliya1111@gmail.com';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendNotificationEmail(resourceTitle: string, resourceType: string, authorName: string, subjectName: string) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: ADMIN_EMAIL,
            subject: `New Contribution Alert: ${resourceTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #333;">New Resource Contributed! 🚀</h2>
                    <p><strong>${authorName}</strong> just uploaded a new <strong>${resourceType}</strong>.</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <tr style="background-color: #f9f9f9;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Title</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${resourceTitle}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Subject</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${subjectName}</td>
                        </tr>
                        <tr style="background-color: #f9f9f9;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Type</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${resourceType}</td>
                        </tr>
                    </table>

                    <p style="margin-top: 20px; color: #666;">
                        Please verify this resource in the Admin Panel.
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[Mail] Notification sent to ${ADMIN_EMAIL}`);
    } catch (error) {
        console.error('[Mail] Failed to send notification email:', error);
        // We don't throw here to avoid failing the resource creation itself
    }
}
