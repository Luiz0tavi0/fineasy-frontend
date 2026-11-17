import { test, expect, loginThroughUi } from "../fixtures/test";

test("authenticated cookies preserve the frontend session after reload", async ({ page, user }) => {
  // Arrange
  await loginThroughUi(page, user);
  const cookies = await page.context().cookies();
  const access = cookies.find((cookie) => cookie.name === "fe_access");
  const refresh = cookies.find((cookie) => cookie.name === "fe_refresh");
  expect(access?.httpOnly).toBe(true);
  expect(refresh?.httpOnly).toBe(true);

  // Act
  await page.reload();

  // Assert
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Transações" })).toBeVisible();
});

test("an invalid access token is refreshed through the frontend session", async ({ page, user }) => {
  // Arrange
  await loginThroughUi(page, user);
  const cookies = await page.context().cookies();
  const access = cookies.find((cookie) => cookie.name === "fe_access");
  const refresh = cookies.find((cookie) => cookie.name === "fe_refresh");
  if (!access || !refresh) throw new Error("Frontend login did not set both httpOnly session cookies");
  await page.context().addCookies([{ ...access, value: "invalid-access-token" }]);

  // Act
  await page.reload();

  // Assert
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  const refreshedAccess = (await page.context().cookies()).find((cookie) => cookie.name === "fe_access");
  expect(refreshedAccess).toBeDefined();
  expect(refreshedAccess?.value).not.toBe("invalid-access-token");
});

test("an invalid refresh token clears the session and redirects to login", async ({ page, user }) => {
  // Arrange
  await loginThroughUi(page, user);
  const cookies = await page.context().cookies();
  const access = cookies.find((cookie) => cookie.name === "fe_access");
  const refresh = cookies.find((cookie) => cookie.name === "fe_refresh");
  if (!access || !refresh) throw new Error("Frontend login did not set both httpOnly session cookies");
  await page.context().addCookies([
    { ...access, value: "invalid-access-token" },
    { ...refresh, value: "invalid-refresh-token" },
  ]);

  // Act
  await page.goto("/");

  // Assert
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Entre na sua conta", { exact: true })).toBeVisible();
  const remainingCookies = await page.context().cookies();
  expect(remainingCookies.some((cookie) => cookie.name === "fe_access")).toBe(false);
  expect(remainingCookies.some((cookie) => cookie.name === "fe_refresh")).toBe(false);
});
