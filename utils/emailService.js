const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail', // or your email service
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // Use app password for Gmail
        }
    });
};

// Email template for request notifications
const createNotificationEmail = (recipientName, requestDetails, options = {}) => {
    const { captionText, imageCid, verifyLink } = options;
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sunseeker - Request Received</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(90deg,rgba(255, 209, 213, 1) 0%, rgba(255, 236, 173, 1) 100%);
            }
            .email-container {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 15px;
                padding: 40px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 2.5rem; font-weight: bold; color: #4c2307; margin-bottom: 10px; }
            .subtitle { color: #666; font-size: 1.1rem; }
            .content { background: rgba(255, 255, 255, 0.8); padding: 25px; border-radius: 10px; border-left: 4px solid #ffda53; margin: 20px 0; }
            .request-details { background: rgba(255, 255, 255, 0.9); padding: 20px; border-radius: 8px; margin: 15px 0; border: 2px solid #ffda53; }
            .request-details h3 { color: #4c2307; margin-top: 0; margin-bottom: 15px; }
            .detail-row { margin-bottom: 10px; }
            .detail-label { font-weight: bold; color: #4c2307; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ffda53; color: #666; font-size: 0.9rem; }
            .cta-button { display: inline-block; background: #ffda53; color: #4c2307; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; transition: all 0.3s ease; }
            .cta-button:hover { background: #4c2307; color: #ffda53; }
            .attachment { margin: 20px 0; text-align: center; background: rgba(255,255,255,0.9); padding: 15px; border-radius: 10px; border: 2px solid #ffda53; }
            .attachment img { max-width: 100%; border-radius: 8px; }
            .caption { color: #4c2307; font-weight: bold; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">Sunseeker</div>
                <div class="subtitle">Find what you seek</div>
            </div>
            
            <div class="content">
                <h2 style="color: #4c2307; margin-top: 0;">Request Received!</h2>
                <p>Dear ${recipientName},</p>
                <p>Thank you for reaching out to us. We have received your request and our team will review it shortly.</p>
                
                ${imageCid ? `
                    <div class="attachment">
                        <img src="cid:${imageCid}" alt="Attachment" />
                        ${captionText ? `<div class="caption">${captionText}</div>` : ''}
                    </div>
                ` : ''}
                
                ${verifyLink ? `
                    <div style="text-align: center;">
                        <a href="${verifyLink}" class="cta-button">Click this button to verify your payment with the seeker</a>
                    </div>
                ` : ''}

                <div class="request-details">
                    <h3>Your Request Details:</h3>
                    <div class="detail-row"><span class="detail-label">Name:</span> ${requestDetails.name}</div>
                    <div class="detail-row"><span class="detail-label">Email:</span> ${requestDetails.email}</div>
                    <div class="detail-row">
                        <span class="detail-label">Message:</span><br>
                        <div style="background: rgba(255, 255, 255, 0.7); padding: 10px; border-radius: 5px; margin-top: 5px;">${requestDetails.message}</div>
                    </div>
                    <div class="detail-row"><span class="detail-label">Submitted:</span> ${new Date(requestDetails.createdAt).toLocaleString()}</div>
                </div>
                
                <p>We typically respond within 24-48 hours. You'll receive a follow-up email with our response.</p>
                <div style="text-align: center;"><a href="http://localhost:3000" class="cta-button">Visit Our Website</a></div>
            </div>
            
            <div class="footer">
                <p>©2025 Sunseeker, All Rights Reserved.</p>
                <p>This is an automated message, please do not reply directly to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Email template for admin replies (unchanged)
const createReplyEmail = (recipientName, adminReply, originalRequest) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sunseeker - Response to Your Request</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(90deg,rgba(255, 209, 213, 1) 0%, rgba(255, 236, 173, 1) 100%); }
            .email-container { background: rgba(255, 255, 255, 0.95); border-radius: 15px; padding: 40px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 2.5rem; font-weight: bold; color: #4c2307; margin-bottom: 10px; }
            .subtitle { color: #666; font-size: 1.1rem; }
            .content { background: rgba(255, 255, 255, 0.8); padding: 25px; border-radius: 10px; border-left: 4px solid #ffda53; margin: 20px 0; }
            .reply-section { background: rgba(255, 255, 255, 0.9); padding: 20px; border-radius: 8px; margin: 15px 0; border: 2px solid #4c2307; }
            .original-request { background: rgba(255, 255, 255, 0.7); padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 3px solid #ffda53; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ffda53; color: #666; font-size: 0.9rem; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">Sunseeker</div>
                <div class="subtitle">Find what you seek</div>
            </div>
            
            <div class="content">
                <h2 style="color: #4c2307; margin-top: 0;">Response to Your Request</h2>
                <p>Dear ${recipientName},</p>
                <p>Thank you for contacting us. Here is our response to your request:</p>
                
                <div class="reply-section">
                    <h3 style="color: #4c2307; margin-top: 0;">Our Response:</h3>
                    <div style="background: rgba(255, 255, 255, 0.7); padding: 15px; border-radius: 5px; margin: 10px 0;">${adminReply}</div>
                </div>
                
                <div class="original-request">
                    <h4 style="color: #4c2307; margin-top: 0;">Your Original Request:</h4>
                    <p><strong>Message:</strong> ${originalRequest.message}</p>
                    <p><strong>Submitted:</strong> ${new Date(originalRequest.createdAt).toLocaleString()}</p>
                </div>
                
                <p>If you have any further questions, please don't hesitate to reach out to us again.</p>
            </div>
            
            <div class="footer">
                <p>©2025 Sunseeker, All Rights Reserved.</p>
                <p>This is an automated message, please do not reply directly to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Send notification email (now supports optional inline image + caption + verify link)
const sendNotificationEmail = async (recipientEmail, recipientName, requestDetails, options = {}) => {
    try {
        const transporter = createTransporter();

        let attachments = [];
        let imageCid;
        if (options.image && options.image.buffer && options.image.mimetype) {
            imageCid = `inline-image-${Date.now()}`;
            attachments.push({
                filename: options.image.filename || 'image',
                content: options.image.buffer,
                contentType: options.image.mimetype,
                cid: imageCid
            });
        }

        const htmlContent = createNotificationEmail(recipientName, requestDetails, {
            captionText: options.captionText,
            imageCid,
            verifyLink: options.verifyLink
        });
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: 'Sunseeker - Your Request Has Been Received',
            html: htmlContent,
            attachments
        };
        
        const result = await transporter.sendMail(mailOptions);
        console.log('Notification email sent:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Error sending notification email:', error);
        return { success: false, error: error.message };
    }
};

// Send reply email (unchanged)
const sendReplyEmail = async (recipientEmail, recipientName, adminReply, originalRequest) => {
    try {
        const transporter = createTransporter();
        const htmlContent = createReplyEmail(recipientName, adminReply, originalRequest);
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: 'Sunseeker - Response to Your Request',
            html: htmlContent
        };
        
        const result = await transporter.sendMail(mailOptions);
        console.log('Reply email sent:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Error sending reply email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendNotificationEmail,
    sendReplyEmail
};
