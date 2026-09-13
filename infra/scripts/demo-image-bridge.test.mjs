import { test } from "node:test";
import assert from "node:assert/strict";
import { imageHandler } from "./demo-image-bridge.mjs";

function request(method, url, expiresAt = Date.now() + 1000) {
  const result = {};
  const response = {
    writeHead(status, headers) {
      Object.assign(result, { status, headers });
      return this;
    },
    end(body) {
      result.body = body;
    },
  };
  imageHandler(
    Buffer.from("jpeg"),
    "/opaque.jpg",
    expiresAt,
  )({ method, url }, response);
  return result;
}
test("serves only the approved image, without directory listing or other methods", () => {
  assert.equal(request("GET", "/opaque.jpg").body.toString(), "jpeg");
  assert.equal(request("HEAD", "/opaque.jpg").body, undefined);
  for (const url of ["/", "/.env", "/../runtime.env", "/opaque.jpg?other=1"])
    assert.equal(request("GET", url).status, 404);
  assert.equal(request("POST", "/opaque.jpg").status, 404);
  assert.equal(request("GET", "/opaque.jpg", Date.now() - 1).status, 404);
});
