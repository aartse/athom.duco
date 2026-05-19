import type App from "../../../app";

export default interface RequestWithBody<TBody = Record<string, unknown>> {
  homey: App["homey"];
  query: Record<string, string>;
  params: Record<string, string>;
  body: TBody;
};