// backend/src/scripts/makeAdmin.js
//
// Give (or take away) admin access for an existing account.
//
//   npm run make-admin -- someone@example.com            grant admin
//   npm run make-admin -- someone@example.com --remove   back to a normal user
//   npm run make-admin -- --list                          show current admins
//
// The person must already have signed up in the app. They need to sign out
// and back in (or refresh) after the change for the Admin menu to appear.
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Imported after dotenv so DATABASE_URL is set when the connection is created.
const { db } = await import('../db/index.js');
const { profiles } = await import('../db/schema.js');
const { eq, sql } = await import('drizzle-orm');

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase();
const remove = args.includes('--remove');
const list = args.includes('--list');

const done = (code) => process.exit(code);

try {
  if (list) {
    const admins = await db
      .select({ email: profiles.email, name: profiles.fullName })
      .from(profiles)
      .where(sql`${profiles.role}::text = 'admin'`);
    console.log(admins.length ? admins.map((a) => `👑 ${a.email}${a.name ? ` (${a.name})` : ''}`).join('\n') : 'No admins yet.');
    done(0);
  }

  if (!email) {
    console.error('Usage: npm run make-admin -- <email> [--remove] | --list');
    done(1);
  }

  const [user] = await db
    .select({ id: profiles.id, role: profiles.role })
    .from(profiles)
    .where(sql`lower(${profiles.email}) = ${email}`)
    .limit(1);

  if (!user) {
    console.error(`❌ No account found for ${email}. Sign up in the app first, then run this again.`);
    done(1);
  }

  // 'user' is a role every profiles.role column accepts (enum or text).
  const role = remove ? 'user' : 'admin';
  if (String(user.role) === role) {
    console.log(`ℹ️  ${email} is already ${remove ? 'not an admin' : 'an admin'}.`);
    done(0);
  }

  await db.update(profiles).set({ role, updatedAt: new Date() }).where(eq(profiles.id, user.id));
  console.log(remove
    ? `✅ ${email} is no longer an admin.`
    : `✅ ${email} is now an admin. Sign out and back in, then open /admin (or Menu → Admin).`);
  done(0);
} catch (error) {
  console.error('❌ Failed:', error.message);
  done(1);
}
