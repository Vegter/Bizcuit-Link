import qs from 'qs'
import crypto from "crypto"

/**
 * Convert the given parameters object to a querystring
 */
export function asQueryString(parameters: object) {
    return Object.entries(parameters)
        .map(([key, value]) => `${key}=${value}`)
        .join("&")
}

/**
 * Convert the given parameters object to a URL querystring
 */
export function asData(parameters: object) {
    return qs.stringify(parameters)
}

/**
 * Returns a cryptographically well-built artificial random string of a given size
 */
export function randomString(size: number):string {
    return crypto.randomBytes(size).toString('hex')
}
