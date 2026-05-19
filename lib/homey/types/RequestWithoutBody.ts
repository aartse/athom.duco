import type App from "../../../app";

export default interface RequestWithoutBody {
  homey: App["homey"];
  query: Record<string, string>;
  params: Record<string, string>;
  body: Record<never, never>; // Homey.API sends an empty body for GET and DELETE requests
};