const puppeteer = require('puppeteer');

const netflixCodesUrl = 'https://www.netflix-codes.com/';
const netflixMoviesBaseUrl = 'https://www.netflix.com/browse/genre/';
const netflixMoviesExtraParams = '?so=az';

(async () => {
    let browser = await puppeteer.launch();
    let page = await browser.newPage();

    await page.goto(netflixCodesUrl, { waitUntil: 'networkidle2' });
    
    let arrOfNetflixCodes = await page.evaluate(() => {
        let arrTextCodes = [];
        let nodeListCodes = document.querySelectorAll('a[class="link_to_netflix"] > code');

        nodeListCodes.forEach(function(currentValue, currentIndex, listObj) {
            if (currentValue.innerText !== 'CODE' && currentValue.innerText !== null && currentValue.innerText !== '') {
                arrTextCodes.push(currentValue.innerText);
            }
        })

        return arrTextCodes;
    })

    arrOfNetflixCodes.forEach(function(currentValue, currentValue, listObj) {
        
    })

    await browser.close();
})();