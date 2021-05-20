import { config } from 'dotenv'
import assert from "assert"

if (process.env.NODE_ENV !== 'production') {
    config();
}

// Express
export const PORT = process.env.PORT || "8080"
export const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`

// Sendgrid
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ""
export const MAIL_FROM_ADDRESS = process.env.MAIL_FROM_ADDRESS || ""
assert(SENDGRID_API_KEY && MAIL_FROM_ADDRESS,"Missing Sendgrid parameters")

// Bizcuit
export const BIZCUIT_API = process.env.BIZCUIT_API || ""
export const BIZCUIT_CLIENT_ID = process.env.BIZCUIT_CLIENT_ID || ""
export const BIZCUIT_CLIENT_SECRET = process.env.BIZCUIT_CLIENT_SECRET || ""
assert(BIZCUIT_API && BIZCUIT_CLIENT_ID && BIZCUIT_CLIENT_SECRET,"Missing Bizcuit parameters")
