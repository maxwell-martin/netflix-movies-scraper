const puppeteer = require('puppeteer');
const config = require('./config.json');
const codes = require('./codes.json');
const fs = require('fs');

const netflixMoviesBaseUrl = 'https://www.netflix.com/browse/genre/';
const netflixMoviesExtraParams = '?so=az';
const netflixLoginPage = 'https://www.netflix.com/login';

let movieTitles = [];
let randomWaitTime;

(async () => {
    console.log("Entered async function.");
    const browser = await puppeteer.launch({ headless: false });
    let page = await browser.newPage();

    // Open login page and login
    await page.goto(netflixLoginPage);
    await page.type('#id_userLoginId', config.username);
    await page.type('#id_password', config.password);
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });

    randomWaitTime = Math.random() * 5000;
    console.log("Waiting for " + (randomWaitTime / 1000) + " seconds.");
    await page.waitFor(randomWaitTime);

    // Click the user account
    await page.click('li.profile:nth-child(3) > div:nth-child(1) > a:nth-child(1)');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });
    
    randomWaitTime = Math.random() * 5000;
    console.log("Waiting for " + (randomWaitTime / 1000) + " seconds.");
    await page.waitFor(randomWaitTime);

    for (let [code, description] of Object.entries(codes)) {
        if (!description.includes('TV')) {
            await page.goto(netflixMoviesBaseUrl + code + netflixMoviesExtraParams, { waitUntil: 'networkidle2', timeout: 0 });
            console.log("Loaded " + code);

            randomWaitTime = Math.random() * 5000;
            console.log("Waiting for " + (randomWaitTime / 1000) + " seconds.");
            await page.waitFor(randomWaitTime);

            movieTitles = await scrapeInfiniteScrollItems(page, extractItems, movieTitles);

            console.log('Current list of movie titles:');
            console.log(movieTitles);
        } else {
            console.log(description + " is TV shows not movies. Going to next genre.");
        }
    }

    console.log("Completed scraping Netflix movies.");

    console.log('All movie titles:');
    console.log(movieTitles);

    await writeMovieTitlesToJSON(movieTitles, fs);

    await browser.close();
})();

function extractItems() {
    const extractedElements = document.querySelectorAll('p.fallback-text');
    const items = [];
    extractedElements.forEach(function(element) { 
        items.push(element.innerText); 
    });
    return items;
}

async function scrapeInfiniteScrollItems(
    page,
    extractItems,
    movieTitles,
    scrollDelay = 1000,
) {
    console.log("Scraping page.");

    let items = [];
    try {
        let previousHeight;
        while (items.length < 1000000000000) {
            items = await page.evaluate(extractItems);
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

function writeMovieTitlesToJSON(movieTitles, fs) {
    return new Promise(resolve => {
        console.log("Writing movies to json file.")
        fs.writeFile('movieTitles.json', JSON.stringify(movieTitles), function(err) {
            if (err) throw err;
            console.log('File writing complete.');
            resolve("");
        });
    })
}