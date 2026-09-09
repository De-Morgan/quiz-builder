import { http } from "./api";

// Default SWR fetcher. SWR keys are API paths from `./endpoints`.
export const fetcher = <T>(url: string): Promise<T> =>
  http.get<T>(url).then((r) => r.data);
