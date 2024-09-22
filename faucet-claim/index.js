const puppeteer = require("puppeteer-extra");
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");

puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: "2CaPcha API KEY", // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
  })
);

puppeteer
  .connect({ browserURL: "http://localhost:9222" })
  .then(async (browser) => {
    const page = await browser.newPage();

    // Enable request interception to add custom headers
    await page.setRequestInterception(true);

    page.on("request", (request) => {
      const dynamicIp = `${Math.floor(Math.random() * 255) + 1}.${
        Math.floor(Math.random() * 255) + 1
      }.${Math.floor(Math.random() * 255) + 1}.${
        Math.floor(Math.random() * 255) + 1
      }`;
      const customHeaders = {
        ...request.headers(),
        "X-Forwarded-For": dynamicIp, // Spoofed IP
        "X-Real-IP": dynamicIp, // Spoofed IP
        "Client-IP": dynamicIp, // Spoofed IP
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36", // Custom User-Agent
        Referer: "https://example.com", // Referer to simulate user navigation
        "Accept-Language": "en-US,en;q=0.9", // Language preference
      };

      request.continue({ headers: customHeaders });
    });

    await page.goto("https://faucet.movementlabs.xyz/?network=aptos");

    await page.waitForSelector('input[id=":r4:"]');
    await page.type(
      'input[id=":r4:"]',
      "0x052afcfbafa6e09c851e3cbe7e532cfdd25597f70ae4003ed0384a3631283063"
    );
    await page.solveRecaptchas();
    await page.click(
      'button[class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary MuiButton-disableElevation MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary MuiButton-disableElevation css-1awi05i"]'
    );
    await new Promise((r) => setTimeout(r, 10000));
    await page.close();
  });
