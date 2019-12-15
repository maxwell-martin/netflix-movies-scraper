const puppeteer = require('puppeteer');
const config = require('./config.json');

// const netflixCodesUrl = 'https://www.netflix-codes.com/';
const netflixCodesUrl = 'https://www.techadvisor.co.uk/how-to/photo-video/how-view-all-films-on-netflix-make-netflix-easier-browse-3633396/';
const netflixMoviesBaseUrl = 'https://www.netflix.com/browse/genre/';
const netflixMoviesExtraParams = '?so=az';
const netflixLoginPage = 'https://www.netflix.com/login';

let movieTitles = [];

(async () => {
    console.log("Entered async function.");
    let browser = await puppeteer.launch({ headless: false });
    let page = await browser.newPage();
    page.setViewport({ width: 1280, height: 926 });

    await page.goto(netflixCodesUrl, { waitUntil: 'networkidle2', timeout: 0 });
    console.log("Loaded Netflix codes page.");

    let arrOfNetflixCodes = await page.evaluate(() => {
        console.log("Evaluating Netflix codes page.");
        var codesParagraphTextContent = document.querySelector("#articleBody > p:nth-child(18)").textContent;
        let arrTextCodes = codesParagraphTextContent.match(/\([0-9]+\)/g);
        return arrTextCodes;
    });

    console.log("Done with Netflix codes page.");

    // Open login page and login
    await page.goto(netflixLoginPage);
    await page.type('#id_userLoginId', config.username);
    await page.type('#id_password', config.password);
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });

    await page.waitFor(Math.random() * 10000);

    // Click the user account
    await page.click('li.profile:nth-child(3) > div:nth-child(1) > a:nth-child(1)');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });

    await page.waitFor(Math.random() * 10000);

    for (i = 0; i < 2/*arrOfNetflixCodes.length*/; i++) {
        let currentValue = arrOfNetflixCodes[i].substr(1, arrOfNetflixCodes[i].lastIndexOf(')') - 1);
        await page.goto(netflixMoviesBaseUrl + currentValue + netflixMoviesExtraParams, { waitUntil: 'networkidle2', timeout: 0 });
        console.log("Loaded " + currentValue);

        await page.waitFor(Math.random() * 10000);

        movieTitles = await scrapeInfiniteScrollItems(page, extractItems, movieTitles);
    }

    console.log("Completed scraping Netflix movies.");

    console.log(movieTitles);

    await browser.close();
})();

function extractItems() {
    const extractedElements = document.querySelectorAll('p.fallback-text');
    const items = [];
    extractedElements.forEach(function(element) { 
        console.log(element.innerText);
        items.push(element.innerText); 
    });
    console.log(items);
    return items;
}

async function scrapeInfiniteScrollItems(
    page,
    extractItems,
    movieTitles,
    scrollDelay = 1000,
) {
    let items = [];
    try {
        let previousHeight;
        while (items.length < 1000000000000) {
            items = await page.evaluate(extractItems);
            console.log(items);
            previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`, { timeout: 5000});
            await page.waitFor(scrollDelay);
        }
    } catch (e) { }

    items.forEach(function(movieTitle) {
        movieTitles.push(movieTitle);
    });

    return uniq_fast(movieTitles);
}

function uniq_fast(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for(var i = 0; i < len; i++) {
         var item = a[i];
         if(seen[item] !== 1) {
               seen[item] = 1;
               out[j++] = item;
         }
    }
    return out;
}








/* OLD CODE */
// var scrollInterval = setInterval(function() { 
//     document.documentElement.scrollTop = document.documentElement.scrollHeight;
// }, 50);

// var stopScroll = function() { clearInterval(scrollInterval); };

// stopScroll();

// var numberOfRows = document.querySelector("div.galleryLockups").children.length;

// var numberOfSliderItems = document.querySelector('div#row-0 div.sliderContent').children.length

// var movieName = document.querySelector("#row-0 div.slider-item-0 p.fallback-text").textContent;

// // Main scraper function; Async so that await can be used to prevent loop from continuing execution until page load and page scrapes are complete
// async function runScraper() {
//     await scrollToBottom();
//     console.log("Finished scrolling to bottom");

// }

// // Scrolls to bottom of netflix page after loading all movies.
// function scrollToBottom() {
//     return new Promise(resolve => {
//         var scrollingElement = (document.scrollingElement || document.body);
//         var height = scrollingElement.scrollHeight;

//         console.log("Height is " + height);

//         var scrollInterval = setInterval(function() { 
//             document.documentElement.scrollTop = document.documentElement.scrollHeight;
//             height = scrollingElement.scrollHeight;
//             if (height >= 61505) {
//                 clearInterval(scrollInterval);
//                 resolve("");
//             }
//         }, 1);
//     });
// }