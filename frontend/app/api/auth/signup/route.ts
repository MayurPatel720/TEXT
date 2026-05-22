import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Comprehensive list of disposable email domains - SERVER SIDE VALIDATION
const disposableEmailDomains = new Set([
  // Most common temporary email services
  "tempmail.com", "temp-mail.org", "tempmailo.com", "tempmailaddress.com",
  "10minutemail.com", "10minutemail.net", "10minmail.com", "10minemail.com",
  "guerrillamail.com", "guerrillamail.org", "guerrillamail.net", "guerrillamail.biz", "guerrillamailblock.com",
  "mailinator.com", "mailinator.net", "mailinator.org", "mailinator2.com",
  "throwaway.email", "throwawaymail.com", "throam.com",
  "yopmail.com", "yopmail.fr", "yopmail.net",
  "fakeinbox.com", "fakemailgenerator.com", "fakemail.net",
  "getnada.com", "nada.email",
  "maildrop.cc", "mailnesia.com",
  "trashmail.com", "trashmail.net", "trashmail.org", "trash-mail.com", "trash-mail.at",
  "dispostable.com", "disposableemailaddresses.com", "discard.email", "discardmail.com",
  "sharklasers.com", "spam4.me", "spamgourmet.com", "spamfree24.org", "spamfree.eu",
  "mailcatch.com", "mytrashmail.com",
  "tempinbox.com", "tempr.email", "tmpmail.org", "tmpmail.net", "tmails.net",
  "getairmail.com", "mohmal.com", "emailondeck.com",
  "mintemail.com", "tempail.com", "emailfake.com",
  "crazymailing.com", "tempsky.com",
  "burnermail.io", "mailsac.com", "inboxkitten.com",
  "33mail.com", "anonaddy.com",
  "jetable.org", "mailexpire.com",
  "spamex.com", "spamspot.com",
  "trbvm.com", "armyspy.com", "cuvox.de",
  "dayrep.com", "einrot.com", "fleckens.hu",
  "gustr.com", "jourrapide.com", "rhyta.com",
  "superrito.com", "teleworm.us",
  "mailfreeonline.com", "mail-temporaire.fr",
  "disbox.org", "disbox.net", "dropmail.me",
  "wegwerfemail.de", "sofort-mail.de",
  // CRITICAL: roratu.com and similar domains
  "roratu.com", "tmail.com", "tmail.ws",
  "mailna.co", "mailna.in", "mailna.me",
  "emltmp.com", "tmpbox.net", "moakt.com", "moakt.ws",
  "emlpro.com", "emlhub.com", "fexpost.com", "fexbox.org", "fexbox.ru",
  "bupmail.com", "clrmail.com", "cyclesat.com",
  "firemailbox.club", "gufum.com", "htomail.com",
  "laafd.com", "labworld.org", "laste.ml", "lyft.live",
  "mailbox.in.ua", "mailbox92.biz", "mailboxy.fun",
  "maildax.com", "maileme101.com", "mailfence.com",
  "mailnax.com", "mailseal.de", "mailtemp.net",
  "mvrht.com", "mvrht.net", "nwytg.com", "nwytg.net",
  "zeroe.ml", "zwoho.com", "zwomail.com",
  "txen.de", "polyfaust.com", "tuta.io",
  "grr.la", "guerrillamail.info",
  "boximail.com", "bobmail.info",
  "tempmail.de", "tempmail.it", "tempmail.ninja",
  "1secmail.com", "1secmail.net", "1secmail.org",
  "wwjmp.com", "ezztt.com", "txcct.com",
  "kzccv.com", "dpptd.com", "rteet.com",
  "oosln.com", "vjuum.com", "lroid.com",
  "email-temp.com", "emailtemporar.ro", "emailtemporario.com.br",
  "cko.kr", "one-time.email", "onetimeusemail.com",
]);

// Patterns that indicate disposable emails
const disposablePatterns = [
  /temp.*mail/i,
  /mail.*temp/i,
  /fake.*mail/i,
  /trash.*mail/i,
  /throw.*away/i,
  /disposable/i,
  /10.*min/i,
  /minute.*mail/i,
  /guerrilla/i,
  /mailinator/i,
];

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;
  
  // Check against blocklist
  if (disposableEmailDomains.has(domain)) {
    return true;
  }
  
  // Check against patterns
  for (const pattern of disposablePatterns) {
    if (pattern.test(domain)) {
      return true;
    }
  }
  
  return false;
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Block disposable/temporary emails
    if (isDisposableEmail(email)) {
      console.log("🚫 Blocked disposable email:", email);
      return NextResponse.json(
        { error: "Temporary or disposable emails are not allowed. Please use a real email address." },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user in MongoDB
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    console.log("✅ User created in MongoDB:", { id: newUser._id, email: newUser.email, name: newUser.name });

    return NextResponse.json(
      { message: "User created successfully", userId: newUser._id.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
