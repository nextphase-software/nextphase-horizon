// SPDX-License-Identifier: AGPL-3.0-only
import init, * as engine from "./generated/engine/horizon_wasm";
import { dispatch, type Request } from "./protocol";
const ready = init();
// Forward initialization failure to the client's worker.onerror handler.
void ready.catch((error: unknown) => {
  setTimeout(() => {
    throw error;
  });
});
self.onmessage = ({ data }: MessageEvent<Request>) => {
  void ready.then(
    () => self.postMessage(dispatch(engine, data)),
    () => {},
  );
};
