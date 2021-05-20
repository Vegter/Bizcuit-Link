import { BizcuitRequest } from "./BizcuitRequest"

/**
 * Bizcuit requests manager
 */
export class Bizcuit {
    static readonly MAX_AGE = 60 * 1000                             // Requests need to be completed within 60 seconds
    private static requests:Record<string, BizcuitRequest> = {}     // All pending requests

    /**
     * Cleanup request that have passed the MAX_AGE
     */
    static cleanUp() {
        const now = new Date()
        Object.entries(Bizcuit.requests).forEach(([id, request]) => {
            const age = now.getTime() - request.timestamp.getTime()
            if (age > Bizcuit.MAX_AGE) {
                Bizcuit.deleteRequest(id)
            }
        })
    }

    /**
     * Register a new request
     */
    private static registerRequest(request: BizcuitRequest): void {
        Bizcuit.requests[request.id] = request
    }

    /**
     * Constructs a request and register the request
     */
    static newRequest(): BizcuitRequest {
        const bizcuitRequest = new BizcuitRequest()
        Bizcuit.registerRequest(bizcuitRequest)
        return bizcuitRequest
    }

    /**
     * Returns the request with the given id or undefined if not found
     */
    static getRequest(id: string): BizcuitRequest | undefined {
        return Bizcuit.requests[id]
    }

    /**
     * Remove a request from the list of pending requests
     */
    static deleteRequest(id: string): void {
        delete Bizcuit.requests[id]
    }
}

/**
 * Clean requests at a regular interval
 * If a request is not completed within the specified time then the request is deleted
 */
setInterval(Bizcuit.cleanUp, Bizcuit.MAX_AGE / 2)
