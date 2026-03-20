export type Staleness = Staleness.State | Staleness.CheckAfter;

export namespace Staleness {
    export const isFresh = (x: Staleness): boolean => {
        switch (x.type) {
            case 'fresh':
                return true;
            case 'stale':
                return false;
            case 'check-after':
                return isFresh(x.current);
        }
    };

    export type State = Fresh | Stale;

    export interface Fresh {
        type: 'fresh';
    }
    export const Fresh: Fresh = { type: 'fresh' };

    export interface Stale {
        type: 'stale';
    }
    export const Stale: Stale = { type: 'stale' };

    export interface CheckAfter {
        type: 'check-after';
        current: State;
        millis: number;
    }

    export const CheckAfter = (current: State, millis: number): CheckAfter => ({
        type: 'check-after',
        current,
        millis,
    });
}
