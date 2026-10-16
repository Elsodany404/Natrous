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
  // SENDGRID NOT WORKING SO I USED MAILTRAP FOR TESTING PURPOSES
  // SendGrid is only used in production when its credentials are set;
  // otherwise fall back to Mailtrap so emails keep working.
  createTransport() {
    const sendgridUser = process.env.SENDGRID_USERNAME;
    const sendgridPass = process.env.SENDGRID_PASSWORD;
    if (process.env.NODE_ENV === 'production' && sendgridUser && sendgridPass) {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: sendgridUser,
          pass: sendgridPass
        }
      });
    }

    const host = process.env.MAILTRAP_HOST;
    const port = Number(process.env.MAILTRAP_PORT);
    const user = process.env.MAILTRAP_USER;
    const pass = process.env.MAILTRAP_PASS;

    if (!host || !port || !user || !pass) {
      throw new Error(
        'Email is not configured: set SENDGRID_USERNAME and SENDGRID_PASSWORD (production) or MAILTRAP_HOST, MAILTRAP_PORT, MAILTRAP_USER and MAILTRAP_PASS'
      );
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  async sendWelcome() {
    await this.send(
      'welcome',
      'welcome to our website thank you for joining us with best wishes'
    );
  }

  async sendSignInNotice() {
    await this.send('signIn', 'New sign-in to your Natours account');
  }

  async send(template: string, message: string) {
    const __fileName = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__fileName);
    const filePath = path.resolve(
      __dirname,
      `../../src/views/emails/${template}.pug`
    );
    const html = pug.renderFile(filePath, {
      firstName: this.firstName,
      url: this.url,
      subject: message
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
