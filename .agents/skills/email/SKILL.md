---
name: email
description: |
  Read and send emails via SMTP and IMAP. Supports attachments,
  HTML/plain text, and mailbox management.
  Optimized for use with ProtonMail Bridge or standard mail servers.
triggers:
  # Sending
  - send email
  - compose mail
  - smtp send
  # Reading
  - check inbox
  - list emails
  - read email
  - fetch mail
  - imap list
  # Management
  - delete email
  - archive email
  - mark as read
invocable: true
argument-hint: "[command] [args...]"
---

# Email Skill

This skill allows the agent to interact with email accounts using SMTP (for
sending) and IMAP (for reading).

## Configuration

The tool expects the following environment variables or a configuration file at `~/.config/email-agent/config.json`:

| Variable | Description | Default (ProtonMail Bridge) |
|----------|-------------|-----------------------------|
| `SMTP_HOST` | SMTP server hostname | `127.0.0.1` |
| `SMTP_PORT` | SMTP server port | `1025` |
| `SMTP_USER` | SMTP username | (required) |
| `SMTP_PASS_COMMAND` | Command to fetch SMTP password | (required) |
| `IMAP_HOST` | IMAP server hostname | `127.0.0.1` |
| `IMAP_PORT` | IMAP server port | `1143` |
| `IMAP_USER` | IMAP username | (required) |
| `IMAP_PASS_COMMAND` | Command to fetch IMAP password | (required) |
| `EMAIL_ALLOW_SELFSIGNED` | Allow self-signed certificates | `true` (if host is 127.0.0.1) |

## Secure Password Management

CuriOS requires the use of `secret-tool` (part of `libsecret`) to manage credentials
securely. Direct password environment variables are not supported for security reasons.

### 1. Store your password

```bash
secret-tool store --label="SMTP gmail password" email smtp_gmail_password
```

> [!IMPORTANT]
> **For Personal Gmail Users:**
> Google no longer allows using your primary account password for third-party
> tools (this is called "Less Secure Apps" deprecation). You **must** generate
> a 16-character **App Password**:
>
> 1. Enable **2-Step Verification** in your Google Account.
> 2. Go to [Google Account Security > 2-Step Verification > App Passwords](https://myaccount.google.com/apppasswords).
> 3. Generate a password for "Other" and name it "CuriOS".
> 4. Use this 16-character code (without spaces) in the `secret-tool store` command
     above.

### 2. Configure the skill

Set the `SMTP_PASS_COMMAND` environment variable or add it to your `config.json`:

**Environment variable:**

```bash
export SMTP_PASS_COMMAND="secret-tool lookup email smtp_gmail_password"
```

**Config file (`~/.config/email-agent/config.json`):**

```json
{
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 465,
  "smtp_user": "your-email@gmail.com",
  "smtp_pass_command": "secret-tool lookup email smtp_gmail_password",
  "smtp_secure": true,
  "imap_host": "imap.gmail.com",
  "imap_port": 993,
  "imap_user": "your-email@gmail.com",
  "imap_pass_command": "secret-tool lookup email smtp_gmail_password",
  "imap_secure": true,
  "allow_selfsigned": false
}
```

## Commands and Usage

The `email-tool` command provides the following subcommands:

### 1. Send Email

Send a new email message.

```bash
email-tool send --to "recipient@example.com" --subject "Hello" --body "Message content"
```

**Flags:**

- `--to`: Recipient email address (required)
- `--subject`: Email subject
- `--body`: Plain text body
- `--html`: HTML body (optional)
- `--attach`: Path to file attachment (optional, repeatable)
- `--cc`: CC recipient
- `--bcc`: BCC recipient

### 2. List Messages

List messages in a mailbox (defaults to INBOX).

```bash
email-tool list --mailbox "INBOX" --limit 10
```

**Flags:**

- `--mailbox`: Mailbox name (default: "INBOX")
- `--limit`: Number of messages to return (default: 10)
- `--search`: Search criteria (e.g., "UNSEEN", "FROM <sender@example.com>")

### 3. Read Message

Read the content of a specific message by its UID or ID.

```bash
email-tool read <uid> --mailbox "INBOX"
```

**Flags:**

- `--mailbox`: Mailbox name (default: "INBOX")
- `--download-attachments`: Download attachments to a temporary directory.

### 4. Delete/Move Message

Manage message lifecycle.

```bash
email-tool delete <uid> --mailbox "INBOX"
email-tool move <uid> --to "Archive" --from "INBOX"
email-tool spam <uid> --mailbox "INBOX"
```

**Spam Flags:**

- `--mailbox`: Source mailbox (default: "INBOX")
- `--target`: Target spam mailbox (default: "Junk")

## When to use me

- When you need to send a notification or report via email.
- When you need to check for a verification code or a specific incoming email.
- When automating email-based workflows (e.g., "Summarize the last 5 emails from my boss").
- When interacting with a local ProtonMail Bridge instance.

## Important Notes

- **ProtonMail Bridge**: By default, this tool is pre-configured to work with a local
  ProtonMail Bridge (127.0.0.1).
- **Common Providers Configuration**:
  Most providers require an **App-Specific Password** instead of your regular password.

| Provider | SMTP Host | SMTP Port | IMAP Host | IMAP Port |
|----------|-----------|-----------|-----------|-----------|
| **Gmail** | `smtp.gmail.com` | `465` (SSL) | `imap.gmail.com` | `993` (SSL) |
| **Outlook**| `smtp.office365.com`| `587` (TLS) | `outlook.office365.com`| `993` (SSL) |
| **iCloud** | `smtp.mail.me.com` | `587` (TLS) | `imap.mail.me.com` | `993` (SSL) |
| **Yahoo**  | `smtp.mail.yahoo.com`| `465` (SSL) | `imap.mail.yahoo.com` | `993` (SSL) |

*Note: For ports 465/993 use `SMTP_SECURE=true` / `IMAP_SECURE=true`. For port 587,
use `false` (it uses STARTTLS).*

- **Security**: Never log or print email passwords. Use environment variables or
  secure configuration files.
- **Attachments**: When reading emails with attachments, use `--download-attachments`
  to make them available for processing.
