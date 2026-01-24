import nodemailer from 'nodemailer';
import { convert } from 'html-to-text';
import path from 'path';
import { fileURLToPath } from 'url';
import pug from 'pug';
import type { IUser } from '../models/userModel.js';

class Email {
  public firstName: string | undefined;

  public to: string;

  public from: string;

  public url: string;

  constructor(user: IUser, url: string) {
    this.firstName = user.name.split(' ')[0];
    this.to = user.email;
    this.from = 'mouhmdsodany@outlook.com';
    this.url = url;
  }

  createTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    } else {
      return nodemailer.createTransport({
        host: process.env.MAILTRAP_EMAIL_HOST,
        port: Number(process.env.MAILTRAP_EMAIL_PORT),
        auth: {
          user: process.env.MAILTRAP_EMAIL_USERNAME,
          pass: process.env.MAILTRAP_EMAIL_PASSWORD
        }
      });
    }
  }

  async sendWelcome() {
    await this.send(
      'welcome',
      'welcome to our website thank you for joining us with best wishes'
    );
  }

  async send(template: string, message: string) {
    const __fileName = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__fileName);
    const filePath = path.resolve(__dirname, `../views/emails/${template}.pug`);
    const html = pug.renderFile(filePath, {
      firstName: this.firstName,
      url: this.url
    });
    const htmlToText = convert(html);
    await this.createTransport().sendMail({
      from: this.from,
      to: this.to,
      html,
      subject: message,
      text: htmlToText
    });
  }
}

export default Email;
