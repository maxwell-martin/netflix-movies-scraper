const puppeteer = require('puppeteer');

const tempEmailUrl = 'https://www.tempmailaddress.com';
const omdbFreeApiSignUpUrl = 'http://www.omdbapi.com/apikey.aspx?__EVENTTARGET=freeAcct&__EVENTARGUMENT=&__LASTFOCUS=&__VIEWSTATE=%2FwEPDwUKLTIwNDY4MTIzNQ9kFgYCAQ9kFgICBw8WAh4HVmlzaWJsZWhkAgIPFgIfAGhkAgMPFgIfAGhkGAEFHl9fQ29udHJvbHNSZXF1aXJlUG9zdEJhY2tLZXlfXxYDBQtwYXRyZW9uQWNjdAUIZnJlZUFjY3QFCGZyZWVBY2N0x0euvR%2FzVv1jLU3mGetH4R3kWtYKWACCaYcfoP1IY8g%3D&__VIEWSTATEGENERATOR=5E550F58&__EVENTVALIDATION=%2FwEdAAU5GG7XylwYou%2BzznFv7FbZmSzhXfnlWWVdWIamVouVTzfZJuQDpLVS6HZFWq5fYpioiDjxFjSdCQfbG0SWduXFd8BcWGH1ot0k0SO7CfuulN6vYN8IikxxqwtGWTciOwQ4e4xie4N992dlfbpyqd1D&at=freeAcct&Email=';

module.exports = {
    getApiKey: async function getApiKey() {
        console.log("Getting API Key...");
        console.log("Launching headless browser...")
        const browser = await puppeteer.launch({ headless: true });
        let page = await browser.newPage();

        await page.setViewport({ width: 1280, height: 800 });

        await page.goto(tempEmailUrl, { waitUntil: 'networkidle2', timeout: 0 });

        // Get temp user with temp email.
        let tempUser = await page.evaluate(() => {
            let email = document.querySelector('#email').innerText;
            let firstName = email.substring(0, email.indexOf('.'));
            let lastName = email.substring(email.indexOf('.') + 1, email.indexOf('@'));
            let use = 'Personal Project. Thanks for the service.';
            let user = {
                email: email,
                firstName: firstName,
                lastName: lastName,
                use: use
            };
            return user;
        }); 

        console.log("Temp User:");
        console.log(tempUser);

        // Signup on OMDB with temp email.
        await page.goto(omdbFreeApiSignUpUrl, { waitUntil: 'networkidle2', timeout: 0 });
        await page.type('#Email2', tempUser.email);
        await page.type('#FirstName', tempUser.firstName);
        await page.type('#LastName', tempUser.lastName);
        await page.type('#TextArea1', tempUser.use);
        await page.click('#Button1', { waitUntil: 'networkidle2', timeout: 0 });

        // Get API key and then verify email.
        await page.goto(tempEmailUrl, { waitUntil: 'networkidle2', timeout: 0 });
        let omdbEmailExists = false;
        while (!omdbEmailExists) {
            console.log("Inside while loop.");
            omdbEmailExists = await page.evaluate(() => {
                let mostRecentEmail = document.querySelector('#schranka > tr').children[0].childNodes[1].nodeValue.trim();
                if (mostRecentEmail !== 'The OMDb API') {
                    document.querySelector("a[class='refresh']").click();
                    return false;
                } else {
                    return true;
                }
            });
            console.log(omdbEmailExists);
        }

        console.log("Loading email...");
        await page.evaluate(() => {
            document.querySelector('#schranka > tr').click();
        });
        console.log("Email loaded.");
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });

        let apiInfo = await page.evaluate(() => {
            var iframe = document.querySelector('#iframeMail');
            var innerDoc = iframe.contentDocument || iframe.contentWindow.document;
            var apiKey = innerDoc.children[0].children[1].childNodes[0].nodeValue.trim();
            apiKey = apiKey.substring(apiKey.indexOf(':') + 2);
            var verificationUrl = innerDoc.children[0].children[1].childNodes[6].nodeValue.trim();
            verificationUrl = verificationUrl.substring(verificationUrl.indexOf(':') + 2);
            let apiInfo = {
                apiKey: apiKey,
                verificationUrl: verificationUrl
            }
            return apiInfo;
        });

        console.log("Api info from email:");
        console.log(apiInfo);

        console.log("Verifying Api Key...");
        await page.goto(apiInfo.verificationUrl, { waitUntil: 'networkidle2', timeout: 0 });
        console.log("Api Key verified.");

        browser.close();

        return apiInfo.apiKey;
    }
}