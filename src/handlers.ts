import { Request, Response } from 'express';
import { BizcuitRequest } from "./BizcuitRequest"
import { Bizcuit } from "./Bizcuit"

/**
 * Provide for a Bizcuit authorization URL
 */
export const bizcuitAuthHandler = (request: Request, response: Response) => {
    response.setHeader('Content-type', 'application/json; charset=utf-8');

    const bizcuitRequest = Bizcuit.newRequest()
    return response.send(JSON.stringify({
        url: bizcuitRequest.authorizeURL,
        requestId: bizcuitRequest.id
    }))
};

/**
 * Handle the Bizcuit authorization response
 */
export const bizcuitAuthResponseHandler  = (request: Request, response: Response) => {
    response.setHeader('Content-type', 'text/html');

    const code = request.query["code"] as string
    const state = request.query["state"] as string

    if (code && state) {
        // Valid call, check if request is known
        const bizcuitRequest = Bizcuit.getRequest(state)
        if (bizcuitRequest) {
            // Request is known, register code and send a pincode to the Bizcuit user email address
            bizcuitRequest.code = code
            bizcuitRequest.sendPincode()
            // Report success
            const successHtml = `
                <h1>Uw verzoek is succesvol verwerkt</h1>
                <p>U ontvangt per mail een code om het verzoek te bevestigen</p>
                <p>U kunt dit venster nu sluiten en het verzoek verder afhandelen in Boekhoud Source</p>
            `
            return response.send(successHtml)
        }
    }

    // Invalid call or request not found, report failure
    const errorHtml = `
        <h1>Uw verzoek kon helaas niet worden verwerkt</h1>
        <p>Verdere verwerking is afgebroken</p>
    `
    return response.send(errorHtml)
};

/**
 * Deliver bank transactions
 *
 * Requires a valid request id and pincode
 * A request can only be answered once. It will immediately be deleted on the first call
 */
export const bizcuitTransactionsHandler = (request: Request, response: Response) => {
    response.setHeader('Content-type', 'application/json; charset=utf-8')

    const requestId = request.query["requestId"] as string
    const pincode = request.query["pincode"] as string

    if (requestId && pincode) {
        // Valid call, check request
        const bizcuitRequest = Bizcuit.getRequest(requestId)
        // Immediately delete request, the request is one-try only
        Bizcuit.deleteRequest(requestId)

        if (bizcuitRequest && bizcuitRequest.verifyPincode(pincode)) {
            // Request is found and pincode matches

            // Collect all query parameters
            const parameters = Object.entries(request.query).reduce((result, [key, value]) => {
                result[key] = value as string
                return result
            }, {} as Record<string, string>)

            // Stream the transactions to the caller
            writeTransactions(response, bizcuitRequest, parameters)

            return
        }
    }

    // Invalid call, request not found or invalid pincode, report failure
    return response.status(400).send(JSON.stringify({
        error: "Request not found or invalid pincode"
    }))
}

/**
 * Stream the bank transactions as an array of transaction objects
 */
async function writeTransactions(response: Response, bizcuitRequest: BizcuitRequest, parameters: Record<string, string>) {
    response.write("[")

    let comma_prefix = false
    for await (const transaction of bizcuitRequest.getAllTransactions(parameters)) {
        if (comma_prefix) {
            // Join multiple transactions object with a comma
            response.write(",")
        }
        response.write(JSON.stringify(transaction))
        comma_prefix = true // prefix any following transactions with a comma
    }

    response.write("]")
    response.end()
}
