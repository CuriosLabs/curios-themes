import { Command } from 'commander';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

const program = new Command();

// Load configuration from file if exists
const CONFIG_PATH = path.join(os.homedir(), '.config', 'email-agent', 'config.json');
let fileConfig: any = {};
if (fs.existsSync(CONFIG_PATH)) {
  try {
    fileConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    console.error(`Warning: Failed to parse config file at ${CONFIG_PATH}`);
  }
}

function getSetting(envVar: string, configKey: string, defaultValue: any): any {
  const val = process.env[envVar] || fileConfig[configKey];
  return val !== undefined ? val : defaultValue;
}

function getPassword(commandEnv: string, configKey: string): string {
  const command = process.env[commandEnv] || fileConfig[`${configKey}_command`];
  if (command) {
    try {
      return execSync(command, { encoding: 'utf8' }).trim();
    } catch (e: any) {
      console.error(`Error executing password command: ${e.message}`);
    }
  }
  
  // Fallback to config file plain text (not recommended but kept for compatibility if already in config.json)
  const pass = fileConfig[configKey];
  if (pass) return pass;

  return '';
}

// Default configuration from environment variables or config file
const smtpHost = getSetting('SMTP_HOST', 'smtp_host', '127.0.0.1');
const imapHost = getSetting('IMAP_HOST', 'imap_host', '127.0.0.1');

const allowSelfSigned = getSetting('EMAIL_ALLOW_SELFSIGNED', 'allow_selfsigned', 
                       smtpHost === '127.0.0.1' || 
                       imapHost === '127.0.0.1' ||
                       (!process.env.SMTP_HOST && !process.env.IMAP_HOST && !fileConfig.smtp_host && !fileConfig.imap_host)) === 'true' || 
                       getSetting('EMAIL_ALLOW_SELFSIGNED', 'allow_selfsigned', false) === true;

const config = {
  smtp: {
    host: smtpHost,
    port: parseInt(getSetting('SMTP_PORT', 'smtp_port', '1025')),
    auth: {
      user: getSetting('SMTP_USER', 'smtp_user', ''),
      pass: getPassword('SMTP_PASS_COMMAND', 'smtp_pass'),
    },
    secure: getSetting('SMTP_SECURE', 'smtp_secure', 'false') === 'true' || fileConfig.smtp_secure === true,
    tls: {
      rejectUnauthorized: !allowSelfSigned
    }
  },
  imap: {
    host: imapHost,
    port: parseInt(getSetting('IMAP_PORT', 'imap_port', '1143')),
    auth: {
      user: getSetting('IMAP_USER', 'imap_user', ''),
      pass: getPassword('IMAP_PASS_COMMAND', 'imap_pass'),
    },
    secure: getSetting('IMAP_SECURE', 'imap_secure', 'false') === 'true' || fileConfig.imap_secure === true,
    tls: {
      rejectUnauthorized: !allowSelfSigned
    }
  }
};

program
  .name('email-tool')
  .description('CLI tool to send and read emails via SMTP and IMAP');

// SEND command
program
  .command('send')
  .description('Send an email message')
  .requiredOption('--to <recipient>', 'Recipient email address')
  .option('--subject <subject>', 'Email subject', '(no subject)')
  .option('--body <body>', 'Plain text body')
  .option('--html <html>', 'HTML body')
  .option('--attach <path...>', 'Path to file attachment(s)')
  .option('--cc <recipient>', 'CC recipient')
  .option('--bcc <recipient>', 'BCC recipient')
  .action(async (options) => {
    const transporter = nodemailer.createTransport(config.smtp);

    const mailOptions: any = {
      from: config.smtp.auth.user,
      to: options.to,
      subject: options.subject,
      text: options.body,
      html: options.html,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attach?.map((p: string) => ({
        filename: path.basename(p),
        path: p
      }))
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
      console.log('Message ID:', info.messageId);
    } catch (error: any) {
      console.error('Error sending email:', error.message);
      process.exit(1);
    }
  });

// LIST command
program
  .command('list')
  .description('List messages in a mailbox')
  .option('--mailbox <name>', 'Mailbox name', 'INBOX')
  .option('--limit <number>', 'Number of messages to return', '10')
  .option('--search <criteria>', 'Search criteria', 'ALL')
  .action(async (options) => {
    const client = new ImapFlow({
      host: config.imap.host,
      port: config.imap.port,
      secure: config.imap.secure,
      auth: config.imap.auth,
      logger: false
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock(options.mailbox);
      try {
        const messages = [];
        const limit = parseInt(options.limit);
        let count = 0;

        for await (const message of client.fetch(options.search, { envelope: true })) {
          if (count >= limit) break;
          messages.push({
            uid: message.uid,
            seq: message.seq,
            subject: message.envelope.subject,
            from: message.envelope.from?.[0]?.address,
            date: message.envelope.date,
          });
          count++;
        }
        console.log(JSON.stringify(messages, null, 2));
      } finally {
        lock.release();
      }
      await client.logout();
    } catch (error: any) {
      console.error('Error listing emails:', error.message);
      process.exit(1);
    }
  });

// READ command
program
  .command('read <uid>')
  .description('Read an email message by UID')
  .option('--mailbox <name>', 'Mailbox name', 'INBOX')
  .option('--download-attachments', 'Download attachments to a temp directory')
  .action(async (uid, options) => {
    const client = new ImapFlow({
      host: config.imap.host,
      port: config.imap.port,
      secure: config.imap.secure,
      auth: config.imap.auth,
      logger: false
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock(options.mailbox);
      try {
        const message = await client.fetchOne(uid, { source: true });
        if (!message || !message.source) {
          throw new Error(`Message with UID ${uid} not found`);
        }

        const parsed = await simpleParser(message.source);
        
        const result: any = {
          uid: uid,
          subject: parsed.subject,
          from: parsed.from?.text,
          to: parsed.to?.text,
          date: parsed.date,
          text: parsed.text,
          html: parsed.html,
          attachments: []
        };

        if (options.downloadAttachments && parsed.attachments) {
          const tempDir = path.join(process.cwd(), 'attachments', uid.toString());
          if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

          for (const att of parsed.attachments) {
            const filePath = path.join(tempDir, att.filename || `attachment-${Date.now()}`);
            fs.writeFileSync(filePath, att.content);
            result.attachments.push({
              filename: att.filename,
              contentType: att.contentType,
              size: att.size,
              path: filePath
            });
          }
        } else if (parsed.attachments) {
          result.attachments = parsed.attachments.map(att => ({
            filename: att.filename,
            contentType: att.contentType,
            size: att.size
          }));
        }

        console.log(JSON.stringify(result, null, 2));
      } finally {
        lock.release();
      }
      await client.logout();
    } catch (error: any) {
      console.error('Error reading email:', error.message);
      process.exit(1);
    }
  });

// DELETE command
program
  .command('delete <uid>')
  .description('Delete an email message by UID')
  .option('--mailbox <name>', 'Mailbox name', 'INBOX')
  .action(async (uid, options) => {
    const client = new ImapFlow({
      host: config.imap.host,
      port: config.imap.port,
      secure: config.imap.secure,
      auth: config.imap.auth,
      logger: false
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock(options.mailbox);
      try {
        await client.messageDelete(uid);
        console.log(`Message with UID ${uid} marked for deletion`);
      } finally {
        lock.release();
      }
      await client.logout();
    } catch (error: any) {
      console.error('Error deleting email:', error.message);
      process.exit(1);
    }
  });

// SPAM command
program
  .command('spam <uid>')
  .description('Mark an email message as spam (move to Junk folder)')
  .option('--mailbox <name>', 'Source mailbox name', 'INBOX')
  .option('--target <name>', 'Target spam mailbox name', 'Junk')
  .action(async (uid, options) => {
    const client = new ImapFlow({
      host: config.imap.host,
      port: config.imap.port,
      secure: config.imap.secure,
      auth: config.imap.auth,
      logger: false
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock(options.mailbox);
      try {
        await client.messageMove(uid, options.target);
        console.log(`Message with UID ${uid} moved to ${options.target}`);
      } finally {
        lock.release();
      }
      await client.logout();
    } catch (error: any) {
      console.error('Error marking as spam:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
