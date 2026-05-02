import { app, listen } from "./app";

if (import.meta.main) {
  listen();
}

export { app };
