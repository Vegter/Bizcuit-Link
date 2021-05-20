import crypto from 'crypto'
import axios from 'axios'
import jwt_decode from "jwt-decode"
import { Mailer } from "./mailer"
import { asData, asQueryString, randomString } from "./utils"
import { BIZCUIT_API, BIZCUIT_CLIENT_ID, BIZCUIT_CLIENT_SECRET, DOMAIN } from "./config"

export class BizcuitRequest {
    readonly id: string                     // Unique request ID
    readonly timestamp: Date                // Request creation date time

    private _code: string = ""              // Bizcuit code for access token
    private readonly pincode: number        // Pincode for user to confirm in Boekhoud Source

    private token: any = {}                 // Access token
    private jwt: any = {}                   // JWT with user info (email)

    constructor() {
        this.id = randomString(20)
        this.pincode = BizcuitRequest.generatePincode()
        this.timestamp = new Date()
    }

    /**
     * Create a "Log In" url to redirect a user to.
     * After providing consent, the user is redirected back to the provided redirect uri with an authorisation code.
     *
     * Important to note: Only the absolute minimum amount of information is requested
     */
    get authorizeURL() {
        const parameters = {
            response_type: "code",
            client_id: BIZCUIT_CLIENT_ID,
            redirect_uri: `${DOMAIN}/bizcuit_auth_response`,
            scope: "openid email account_information",
            state: this.id,
            prompt: "consent"
        }

        return `${BIZCUIT_API}/auth?` + asQueryString(parameters)
    }

    /**
     * Registers the Bizcuit authorization code
     */
    set code(code: string) {
        this._code = code
    }

    /**
     * Checks if the given pincode matches the request
     */
    verifyPincode(pincode: string): boolean {
        return this.pincode.toString() === pincode
    }

    /**
     * Return a random 6 digit integer
     */
    private static generatePincode(): number {
        return crypto.randomInt(100000, 999999)
    }

    /**
     * Provide for an authorization header for Bizcuit API calls
     */
    private authorizationHeader(): {authorization: string} {
        return {
            authorization: `Bearer ${this.token.access_token}`
        }
    }

    /**
     * Exchanging an authorization code or refresh token for an access token
     */
    async getAccessToken() {
        if (this.token.access_token) {
            // Access token already available
            return
        }

        const parameters = {
            grant_type: "authorization_code",
            client_id: BIZCUIT_CLIENT_ID,
            client_secret: BIZCUIT_CLIENT_SECRET,
            code: this._code,
        }

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }

        try {
            const response = await axios.post(`${BIZCUIT_API}/openapi/oauth/token`,
                asData(parameters),
                config
            )
            this.code = ""  // Cannot be re-used
            this.token = response.data
            this.jwt = jwt_decode(this.token.id_token)
        } catch (err) {
            console.error("getAccessToken", err)
            throw new Error('Failed to retrieve Bizcuit access token')
        }
    }

    /**
     * Retrieve all bank accounts accessible with the provided token.
     * Requires scope account_information for balance
     */
    async getBankAccounts(): Promise<any[]> {
        const config = {
            headers: {
                ...this.authorizationHeader()
            }
        }

        try {
            const url = `${BIZCUIT_API}/openapi/bank_accounts`
            const response = await axios.get(url, config)
            return response.data.bank_accounts
        } catch (err) {
            console.error("getBankAccounts", err)
            throw new Error('Failed to retrieve Bizcuit bank accounts')
        }
    }

    /**
     * Retrieve transactions of given bank account.
     * Limited to 100 transactions per request and 180 days in the past.
     * The only reliable way of querying all transactions without gaps is to make use of after_id.
     * Information in from_date and to_date is based on transaction data of the bank and is not necessarily in the correct order.
     * Note that the order of the transactions returned is based on when they are processed by the system.
     * Requires scope account_information.
     */
    async getTransactions(id: string, format: string, afterId: string = ""): Promise<any> {
        const config = {
            headers: {
                ...this.authorizationHeader()
            }
        }

        try {
            let url = `${BIZCUIT_API}/openapi/bank_accounts/${id}/transactions?format=${format}`
            if (afterId) {
                url += `&after_id=${afterId}`
            }
            const response = await axios.get(url, config)
            return response.data
        } catch (err) {
            console.error("getTransactions", err)
            throw new Error('Failed to retrieve Bizcuit bank transactions')
        }
    }

    /**
     * Asynchronous generator for Bizcuit bank transactions
     */
    async *getAllTransactions(parameters: Record<string, string>) {
        const NO_TRANSACTIONS_LEFT = "__NO_TRANSACTIONS_LEFT__"

        await this.getAccessToken()
        const bankAccounts = await this.getBankAccounts()
        for (const bankAccount of bankAccounts) {
            if (bankAccount.active) {
                // Only process active accounts

                // Check for any last id parameter for this bank account
                let lastId = parameters[bankAccount.iban] || ""

                while (lastId !== NO_TRANSACTIONS_LEFT) {
                    // Collect the transactions in CAMT format
                    const data = await this.getTransactions(bankAccount.id, "camt", lastId)
                    lastId = NO_TRANSACTIONS_LEFT

                    const camt = data ? data as string : ""
                    if (camt.length) {
                        // CAMT data received, check for last id
                        const findNtryRefs = /<NtryRef>([a-zA-Z0-9]*)<\/NtryRef>/gm
                        let ntryRef = findNtryRefs.exec(camt)
                        while (ntryRef) {
                            lastId = ntryRef[1]
                            ntryRef = findNtryRefs.exec(camt)
                        }
                        // Yield the transaction
                        yield { camt }
                    }
                }
            }
        }
    }

    /**
     * Send a generated pincode to the Bizcuit user email address
     */
    async sendPincode() {
        // The email address is in the JWT that is sent with the access token
        await this.getAccessToken()
        const html = `
            <h1>Boekhoud Source - Bizcuit download</h1>
            <p style="text-align:center">Please use the following code to download your bankstatements from Bizcuit into Boekhoud Source</p>
            <h2 style="text-align:center">${this.pincode}</h2>
        `
        new Mailer().send({
            to: this.jwt.email,
            subject: "Pincode for Bizcuit download"
        }, html)
    }
}
