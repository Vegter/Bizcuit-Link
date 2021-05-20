import nodemailer from 'nodemailer'
import nodemailerSendgrid from 'nodemailer-sendgrid'
import { MAIL_FROM_ADDRESS, SENDGRID_API_KEY } from "./config"

interface MailDestination {
    to: string,
    subject: string
}

/**
 * Simple mail transport class using Sendgrid as email delivery service
 */
export class Mailer {

    private static readonly transport = nodemailer.createTransport(
        nodemailerSendgrid({
            apiKey: SENDGRID_API_KEY
        })
    )

    /**
     * Send the given html message to the specified destination
     */
    public async send(destination: MailDestination, html: string) {
        try {
            await Mailer.transport.sendMail({
                from: MAIL_FROM_ADDRESS,
                ...destination,
                html
            })
        } catch (err) {
            console.error('Mailer.send', 'Errors occurred, failed to deliver message')
            if (err.response && err.response.body && err.response.body.errors) {
                err.response.body.errors.forEach((error:any) => console.error(`${error.field}: ${error.message}`))
            } else {
                console.error(err)
            }
            throw new Error('Failed to send mail')
        }
    }
}
