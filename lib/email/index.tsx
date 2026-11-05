import "server-only";

import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { emailEnabled, env } from "@/lib/env";
import {
  EmailButton,
  EmailLayout,
  EmailParagraph,
  OtpCode,
} from "@/lib/email/templates";

/**
 * Email delivery.
 *
 * Uses Resend when RESEND_API_KEY is set (with EMAIL_FROM as the sender).
 * Without it — development only — messages are printed to the server console
 * so sign-up verification works with zero setup.
 */

let client: Resend | null = null;
function resend(): Resend {
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  client ??= new Resend(env.RESEND_API_KEY);
  return client;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  react: ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailInput): Promise<void> {
  if (!emailEnabled) {
    // Development fallback only — production refuses to send auth codes this way.
    if (env.NODE_ENV !== "production") console.log(`\n[email:dev] → ${to} | ${subject}\n`);
    return;
  }
  try {
    const html = await render(react);
    const { error } = await resend().emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    if (error) {
      console.warn(`[email:resend:warn] Could not send to ${to}: ${error.message}`);
      if (env.NODE_ENV !== "development") {
        throw new Error(`Resend failed: ${error.name} — ${error.message}`);
      }
    }
  } catch (err) {
    console.warn(`[email:resend:warn] Error sending to ${to}:`, err instanceof Error ? err.message : err);
    if (env.NODE_ENV !== "development") {
      throw err;
    }
  }
}

const appUrl = () => env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

// ---------------------------------------------------------------------------
// Typed senders — one per notification the product sends
// ---------------------------------------------------------------------------

export type AuthCodePurpose = "email-verification" | "forget-password";

/**
 * Account verification / password-reset code. Sent through the existing Resend
 * integration (`RESEND_API_KEY`, `EMAIL_FROM`); never logged in production.
 */
export function sendAuthCodeEmail(input: {
  to: string;
  code: string;
  locale: string;
  purpose: AuthCodePurpose;
}) {
  if (!emailEnabled && env.NODE_ENV === "production") {
    // Never fall back to logging a credential code in production.
    throw new Error("RESEND_API_KEY must be set in production to send verification codes");
  }
  const bn = input.locale === "bn";
  const verify = input.purpose === "email-verification";
  const copy = verify
    ? {
        subject: bn ? `APON ইমেইল যাচাই কোড: ${input.code}` : `Verify your APON email: ${input.code}`,
        preview: bn ? "আপনার APON অ্যাকাউন্ট যাচাই করুন" : "Confirm your email to finish creating your APON account",
        heading: bn ? "আপনার ইমেইল যাচাই করুন" : "Verify your email",
        body: bn
          ? "APON-এ স্বাগতম! অ্যাকাউন্ট তৈরি শেষ করতে নিচের কোডটি দিন। কোডটি ১০ মিনিট কার্যকর।"
          : "Welcome to APON! Enter the code below to finish creating your account. It is valid for 10 minutes.",
      }
    : {
        subject: bn ? `APON পাসওয়ার্ড রিসেট কোড: ${input.code}` : `Reset your APON password: ${input.code}`,
        preview: bn ? "আপনার পাসওয়ার্ড রিসেট করুন" : "Use this code to choose a new password",
        heading: bn ? "পাসওয়ার্ড রিসেট করুন" : "Reset your password",
        body: bn
          ? "নতুন পাসওয়ার্ড সেট করতে নিচের কোডটি দিন। কোডটি ১০ মিনিট কার্যকর। রিসেটের পর আপনার সব ডিভাইস থেকে সাইন আউট হয়ে যাবে।"
          : "Enter the code below to choose a new password. It is valid for 10 minutes. Resetting signs you out on every device.",
      };

  return sendEmail({
    to: input.to,
    subject: copy.subject,
    react: (
      <EmailLayout preview={copy.preview} heading={copy.heading}>
        <EmailParagraph>{copy.body}</EmailParagraph>
        <OtpCode code={input.code} />
        <EmailParagraph>
          {bn
            ? "এই কোডটি কাউকে শেয়ার করবেন না — APON কখনো কোড চাইবে না। আপনি এটা না চাইলে ইমেইলটি উপেক্ষা করুন।"
            : "Never share this code — APON will never ask you for it. If you didn't request it, you can ignore this email."}
        </EmailParagraph>
      </EmailLayout>
    ),
  });
}

/**
 * Sent when someone tries to sign up with an email that already has an account.
 * The sign-up form shows the same response either way, so emails can't be probed.
 */
export function sendAccountExistsEmail(input: { to: string; locale: string }) {
  const bn = input.locale === "bn";
  return sendEmail({
    to: input.to,
    subject: bn ? "আপনার ইতিমধ্যে একটি APON অ্যাকাউন্ট আছে" : "You already have an APON account",
    react: (
      <EmailLayout
        preview={bn ? "সাইন ইন করুন বা পাসওয়ার্ড রিসেট করুন" : "Sign in or reset your password"}
        heading={bn ? "আপনার অ্যাকাউন্ট আছে" : "You already have an account"}
      >
        <EmailParagraph>
          {bn
            ? "কেউ (সম্ভবত আপনি) এই ইমেইল দিয়ে নতুন অ্যাকাউন্ট খোলার চেষ্টা করেছেন। আপনার অ্যাকাউন্ট আগে থেকেই আছে — সাইন ইন করুন, অথবা পাসওয়ার্ড ভুলে গেলে রিসেট করুন।"
            : "Someone (probably you) tried to create a new account with this email. You already have one — sign in, or reset your password if you've forgotten it."}
        </EmailParagraph>
        <EmailButton href={`${appUrl()}/${bn ? "bn" : "en"}/sign-in`} label={bn ? "সাইন ইন" : "Sign in"} />
        <EmailParagraph>
          {bn ? "আপনি না হলে এই ইমেইলটি উপেক্ষা করুন।" : "If this wasn't you, you can safely ignore this email."}
        </EmailParagraph>
      </EmailLayout>
    ),
  });
}

export function sendCircleInviteEmail(input: {
  to: string;
  locale: string;
  circleName: string;
  memberCount: number;
}) {
  const bn = input.locale === "bn";
  return sendEmail({
    to: input.to,
    subject: bn
      ? `আপনার সাপ্তাহিক সার্কেল তৈরি হয়েছে — ${input.circleName}`
      : `Your weekly circle is ready — ${input.circleName}`,
    react: (
      <EmailLayout
        preview={bn ? "একটি নতুন সার্কেলে আপনাকে আমন্ত্রণ জানানো হয়েছে" : "You have been invited to a circle"}
        heading={input.circleName}
      >
        <EmailParagraph>
          {bn
            ? `আপনার মতামত ও সময়ের ভিত্তিতে ${input.memberCount} জনের একটি ছোট সার্কেল তৈরি করা হয়েছে। প্রথমে মিলিয়ে নিন কোন দিন দেখা হবে।`
            : `A small circle of ${input.memberCount} people has been formed around your interests and availability. Start by picking the day that works for everyone.`}
        </EmailParagraph>
        <EmailButton
          href={`${appUrl()}/circles`}
          label={bn ? "সার্কেল দেখুন" : "Open your circle"}
        />
      </EmailLayout>
    ),
  });
}

export function sendActivityReminderEmail(input: {
  to: string;
  locale: string;
  title: string;
  when: string;
  address?: string;
}) {
  const bn = input.locale === "bn";
  return sendEmail({
    to: input.to,
    subject: bn ? `কালীন অনুষ্ঠান: ${input.title}` : `Tomorrow: ${input.title}`,
    react: (
      <EmailLayout
        preview={input.title}
        heading={input.title}
      >
        <EmailParagraph>
          {bn ? "আপনি যোগ দিচ্ছেন:" : "You are going:"} {input.when}
        </EmailParagraph>
        {input.address ? (
          <EmailParagraph>
            {bn ? "ঠিকানা:" : "Address:"} {input.address}
          </EmailParagraph>
        ) : null}
        <EmailButton href={`${appUrl()}/activities`} label={bn ? "বিস্তারিত" : "View details"} />
      </EmailLayout>
    ),
  });
}

export function sendWaitlistPromotionEmail(input: {
  to: string;
  locale: string;
  title: string;
  when: string;
}) {
  const bn = input.locale === "bn";
  return sendEmail({
    to: input.to,
    subject: bn
      ? `আপনার জায়গা খালি হয়েছে — ${input.title}`
      : `A spot opened up — ${input.title}`,
    react: (
      <EmailLayout
        preview={input.title}
        heading={bn ? "আপনি এখন তালিকাভুক্ত!" : "You are in!"}
      >
        <EmailParagraph>
          {bn
            ? `“${input.title}” অনুষ্ঠানে একটি জায়গা খালি হয়েছে এবং আপনি স্বয়ংক্রিয়ভাবে তালিকাভুক্ত হয়েছেন।`
            : `A spot opened up for "${input.title}" and you have been moved from the waitlist.`}
        </EmailParagraph>
        <EmailParagraph>{input.when}</EmailParagraph>
        <EmailButton href={`${appUrl()}/activities`} label={bn ? "দেখুন" : "View activity"} />
      </EmailLayout>
    ),
  });
}

export function sendHostApprovalEmail(input: { to: string; locale: string; approved: boolean }) {
  const bn = input.locale === "bn";
  const title = input.approved
    ? bn
      ? "আপনি এখন হোস্ট!"
      : "You are a host now"
    : bn
      ? "আপনার আবেদনের ফলাফল"
      : "About your host application";
  return sendEmail({
    to: input.to,
    subject: title,
    react: (
      <EmailLayout preview={title} heading={title}>
        <EmailParagraph>
          {input.approved
            ? bn
              ? "অভিনন্দন! এখন আপনি অনুষ্ঠান তৈরি করতে পারবেন। প্রতিটি অনুষ্ঠান অ্যাডমিনের অনুমোদনের পরে প্রকাশিত হবে।"
              : "Congratulations! You can now create activities. Each activity is published after an admin approves it."
            : bn
              ? "দুঃখিত, এই সময়ে আমরা আপনার আবেদন অনুমোদন করতে পারিনি। আপনি পরে আবার আবেদন করতে পারেন।"
              : "Unfortunately we can't approve your application at this time. You are welcome to apply again later."}
        </EmailParagraph>
        <EmailButton href={`${appUrl()}/host`} label={bn ? "হোস্ট পর্দা" : "Host dashboard"} />
      </EmailLayout>
    ),
  });
}

export function sendFeedbackRequestEmail(input: {
  to: string;
  locale: string;
  title: string;
  circleName?: string;
}) {
  const bn = input.locale === "bn";
  return sendEmail({
    to: input.to,
    subject: bn ? "কেমন লাগল? — আপনার মতামত জানান" : "How was it? — share your feedback",
    react: (
      <EmailLayout
        preview={input.title}
        heading={bn ? "কেমন লাগল?" : "How did it go?"}
      >
        <EmailParagraph>
          {bn
            ? `“${input.title}” অনুষ্ঠান শেষ হয়েছে। তিনটি প্রশ্নের উত্তর দিতে এক মিনিট সময় নিন — এটি কেউ দেখবে না।`
            : `"${input.title}" has wrapped up. Take a minute to answer three questions — they stay private.`}
        </EmailParagraph>
        <EmailButton href={`${appUrl()}/activities`} label={bn ? "মতামত দিন" : "Give feedback"} />
      </EmailLayout>
    ),
  });
}
