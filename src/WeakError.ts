// unfortunately you can fail a `Promise` with anything. It's often an `Error`, though
export type WeakError = Error | unknown;
