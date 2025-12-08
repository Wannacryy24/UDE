class UDESDK {
  constructor() {
    this.baseURL = "http://localhost:8080"; 
    this.anonymousId = this.getAnonymousId();
  }

  getAnonymousId() {
    let id = localStorage.getItem("ude_anon_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("ude_anon_id", id);
    }
    return id;
  }

  async track(event, properties = {}) {
    const body = {
      event,
      properties,
      user: {
        anonymous_id: this.anonymousId
      }
    };

    return fetch(`${this.baseURL}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }

  async identify(userId, traits = {}) {
    const body = {
      user_id: userId,
      traits,
      anonymous_id: this.anonymousId
    };

    return fetch(`${this.baseURL}/identify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }
}

export default new UDESDK();