// generate-vapid-keys.js — run once to generate your own VAPID keypair for
// push notifications. Every deployment should have its own keys — never
// share these or commit them to git.
// Usage: node generate-vapid-keys.js
import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('\nAdd these to your .env files:\n');
console.log('# server/.env (root)');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:you@example.com`);
console.log('\n# client/.env');
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log('');
