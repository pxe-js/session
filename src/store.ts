import { createHash } from "crypto";

function hash(d: string) {
    return createHash("sha384").update(d).digest("hex");
}

class Store {
    private readonly sessionStore: {
        [id: string]: {
            readonly id: string,
            readonly data: any,
            readonly expireDate?: number,
        }
    } = {};
    private idCount = 0;

    /**
     * Save a session
     * @param data 
     * @param id 
     * @param maxAge 
     */
    save(data: any, id?: string, maxAge?: number) {
        const currentDate = Date.now();
        const newID = id ?? hash(String(currentDate) + this.idCount);

        if (data)
            this.sessionStore[id] = {
                id: newID,
                data
            }

        if (typeof maxAge === "number" && this.sessionStore[newID])
            // @ts-ignore
            this.sessionStore[newID].expireDate = currentDate + maxAge;

        // Generate different hash
        if (!id || !this.sessionStore[id])
            ++this.idCount;

        return newID;
    }

    /**
     * Get a session by its id
     * @param id 
     */
    get(id: string) {
        const session = this.sessionStore[id];
        if (!session)
            return;

        if (session.expireDate && session.expireDate < Date.now()) {
            delete this.sessionStore[id];
            return;
        }

        return session;
    }

    /**
     * Destroy this session
     * @param id 
     */
    destroy(id: string) {
        return delete this.sessionStore[id];
    }
}

export = Store;