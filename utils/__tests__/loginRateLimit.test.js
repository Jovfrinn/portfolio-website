/** @jest-environment node */
const httpMocks = require("node-mocks-http");
const { isLocked, registerFailedAttempt, clearAttempts } = require("../loginRateLimit");

function cookieHeaderFromRes(res) {
  const setCookie = res.getHeader("Set-Cookie");
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return cookieStr.split(";")[0];
}

test("locks after 5 failed attempts and unlocks after clearAttempts", () => {
  let req = httpMocks.createRequest({ cookies: {} });
  let res = httpMocks.createResponse();

  for (let i = 0; i < 5; i++) {
    registerFailedAttempt(req, res);
    const [, value] = cookieHeaderFromRes(res).split("=");
    req = httpMocks.createRequest({ cookies: { portfolio_login_attempts: value } });
    res = httpMocks.createResponse();
  }

  expect(isLocked(req)).toBe(true);

  clearAttempts(req, res);
  const [, clearedValue] = cookieHeaderFromRes(res).split("=");
  const clearedReq = httpMocks.createRequest({ cookies: { portfolio_login_attempts: clearedValue } });
  expect(isLocked(clearedReq)).toBe(false);
});

test("is not locked before 5 attempts", () => {
  let req = httpMocks.createRequest({ cookies: {} });
  let res = httpMocks.createResponse();

  for (let i = 0; i < 4; i++) {
    registerFailedAttempt(req, res);
    const [, value] = cookieHeaderFromRes(res).split("=");
    req = httpMocks.createRequest({ cookies: { portfolio_login_attempts: value } });
    res = httpMocks.createResponse();
  }

  expect(isLocked(req)).toBe(false);
});
