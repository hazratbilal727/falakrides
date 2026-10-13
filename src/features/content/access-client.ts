// Serialize access changes so a slow PIN response cannot undo a later logout.
export class ContentAccessClient {
  private pending: Promise<void> = Promise.resolve();
  constructor(private request: typeof fetch = (input, init) => globalThis.fetch(input, init)) {}

  send(action: "login" | "logout", pin?: string): Promise<Response> {
    const result = this.pending.then(() => this.request("/api/content/access", {
      method: "POST", keepalive: action === "logout",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({action, ...(pin === undefined ? {} : {pin})}),
    }));
    this.pending = result.then(() => {}, () => {});
    return result;
  }
}

export const contentAccessClient = new ContentAccessClient();
