import { createHash } from "crypto";

function hash(d: string) {
    return createHash("sha384").update(d).digest("hex");
}

class Store {
    private readonly sessionStore: {
        [id: string]: {
            readonly id: string,
            readonly data: any,
        }
    } = {};
    private idCount = 0;

    /**
     * Save a session
     * @param data 
     * @param id 
     */
    save(data: any, id?: string) {
        const currentDate = Date.now();
        const newID = id ?? hash(String(currentDate) + this.idCount);

        this.sessionStore[newID] = {
            id: newID,
            data
        }

        // Generate different hash
        ++this.idCount;

        return newID;
    }

    /**
     * Get a session by its id
     * @param id 
     */
    get(id: string) {
        return this.sessionStore[id];
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