// import res from "express/lib/response";
import apiRequest, { HTTPError } from "./api.js";

/* A data model representing a user of the app. */
export default class User {
  /* Returns an array of user IDs */
  static async listUsers() {
    let data = await apiRequest("GET", "/users");
    return data.users;
  }

  /* Returns a User object, creating the user if necessary. */
  static async loadOrCreate(id) {
    try {
      let data = await apiRequest("GET", `/users/${id}`);
      return new User(data);
    } catch (e) {
      let newData = await apiRequest("POST", "/users", { id: id });
      return new User(newData);
    }
  }

  constructor(data) {
    Object.assign(this, data);
    this._path = `/users/${this.id}`;
  }

  async _reload() {
    let updatedData = await apiRequest("GET", `${this._path}`);
    Object.assign(this, updatedData);
  }

  /* Returns an Object containing only the public instances variables. */
  toJSON() {
    let data = {
      id: this.id,
      name: this.name,
      quote: this.quote,
    };
    return data;
  }

  /* Save the current name and quote of the user to the server. */
  async save() {
    await apiRequest("PATCH", `${this._path}`, this.toJSON());
    await this._reload();
  }

  /* Return user's activities. */
  async getStats() {
    let data = await apiRequest("GET", `${this._path}/stats`);
    return data;
  }

  /* Add a new activity with the given activity name. */
  async addActivity(text) {
    await apiRequest("POST", `${this._path}/activities`, { text: text });
  }

  /* Delete user account. */
  async deleteUser(id) {
    await apiRequest("DELETE", `/users/${id}`);
  }
}
