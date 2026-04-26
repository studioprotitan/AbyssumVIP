import Stripe from 'stripe';
import dotenv from 'dotenv';

// 1. Load the environment
dotenv.config({ path: '.env.local' }); // Or '.env' depending on your setup

const key = process.env.STRIPE_SECRET_KEY;

console.log("--- STRIPE AUTH DIAGNOSTIC ---");
console.log("Key Found:", key ? "YES" : "NO");

if (key) {
    console.log("Key Prefix:", key.substring(0, 7));
    if (key.startsWith('pk_')) {
        console.error("ERROR: You are using a PUBLISHABLE key on the backend!");
    } else if (key.startsWith('sk_')) {
        console.log("SUCCESS: This looks like a Secret Key.");
    }
} else {
    console.error("ERROR: STRIPE_SECRET_KEY is undefined. Check your .env file location.");
}