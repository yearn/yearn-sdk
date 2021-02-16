import { Response } from "node-fetch";

export async function handleHTTPError(response: Response): Promise<Response> {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}
