const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local to find Supabase keys
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Failed to parse Supabase URL or Key from .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  console.log('Fetching latest webhook event log...');
  const { data: events, error: err1 } = await supabase
    .from('webhook_events')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(1);

  if (err1) {
    console.error('Error fetching webhook events:', err1);
  } else if (events && events.length > 0) {
    const e = events[0];
    console.log('--- LATEST WEBHOOK EVENT ---');
    console.log(`ID: ${e.id}`);
    console.log(`Type: ${e.event_type}`);
    console.log(`Received: ${e.received_at}`);
    console.log(`Processed: ${e.processed}`);
    console.log(`Processed At: ${e.processed_at}`);
    console.log(`Error: ${e.error}`);
  }

  console.log('\nFetching latest commenters (likers)...');
  const { data: likers, error: err2 } = await supabase
    .from('likers')
    .select('*')
    .order('liked_at', { ascending: false })
    .limit(3);

  if (err2) {
    console.error('Error fetching likers:', err2);
  } else if (likers && likers.length > 0) {
    console.log('--- LATEST COMMENTERS ---');
    likers.forEach((l, idx) => {
      console.log(`[${idx+1}] ID: ${l.id}`);
      console.log(`    Username: @${l.liker_username}`);
      console.log(`    Comment: "${l.comment_text}"`);
      console.log(`    Replied: ${l.public_reply_sent}`);
      console.log(`    DM'd: ${l.instagram_dm_sent}`);
      console.log(`    Message Sent Status: ${l.message_sent}`);
      console.log(`    Email Sent: ${l.email_sent}`);
      console.log(`    Converted: ${l.was_converted}`);
    });
  }

  console.log('\nFetching latest outreach logs (messages_sent)...');
  const { data: msgs, error: err3 } = await supabase
    .from('messages_sent')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(3);

  if (err3) {
    console.error('Error fetching messages_sent:', err3);
  } else if (msgs && msgs.length > 0) {
    console.log('--- LATEST OUTREACH LOGS ---');
    msgs.forEach((m, idx) => {
      console.log(`[${idx+1}] Channel: ${m.channel}`);
      console.log(`    Text: "${m.message_text}"`);
      console.log(`    Sent At: ${m.sent_at}`);
    });
  }
}

main().catch(console.error);
