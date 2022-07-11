import { Context, Middleware, NextFunction } from "@pxe/server";
import Store from "./store";

declare module "@pxe/server" {
    interface Context {
        readonly session: {
            /**
             * The session ID
             */
            readonly id: string;

            /**
             * Session data
             */
            readonly data: any;

            /**
             * Session max age
             */
            readonly maxAge: number;

            /**
             * Set the session data
             * @param data 
             */
            setData(data: any): void;

            /**
             * Delete the session in the session store.
             */
            destroy(): void;

            /**
             * Check whether the session is destroyed
             */
            readonly destroyed: boolean;
        }
    }
}

interface Session extends Middleware { }

class Session extends Function {
    constructor(public readonly store: Store = new Store(), public readonly maxAge?: number) {
        super();

        return new Proxy(this, {
            apply(t, _, a) {
                return t.invoke(...a as [Context, NextFunction, ...any[]]);
            }
        });
    }

    /**
     * The default session store.
     */
    static readonly Store = Store;
    
    async invoke(ctx: Context, next: NextFunction, ...args: any[]) {
        // @ts-ignore
        ctx.session = {
            id: ctx.cookie.value,
            setData: (data: any) => {
                if (ctx.session.destroyed) 
                    throw new Error("Session already destroyed");

                // @ts-ignore
                ctx.session.id = this.store.save(data, ctx.session.id, this.maxAge);

                // @ts-ignore
                ctx.session.data = data;
            },
            maxAge: this.maxAge,
            destroyed: false,
            destroy: () => {
                // @ts-ignore
                ctx.session.destroyed = true;
                this.store.destroy(ctx.session.id);

                // @ts-ignore
                ctx.session.id = undefined;
                ctx.cookie.remove();
            }
        };

        // Initialize the session data
        if (!ctx.session.id)
            ctx.session.setData(undefined);
        else
            // @ts-ignore
            ctx.session.data = this.store.get(ctx.session.id)?.data ?? undefined;

        ctx.cookie.value = ctx.session.id;

        await next(...args);
    }
}

export = Session;