const puppeteer = require('puppeteer');
const request = require('request-promise');

const netflixMoviesBaseUrl = 'https://www.netflix.com/browse/genre/';
const netflixMoviesExtraParams = '?so=az';
const netflixLoginPage = 'https://www.netflix.com/login';
const netflixMoviesPage ='https://www.netflix.com/browse/genre/34399';
const rottenTomatoesBaseUrl = 'https://www.rottentomatoes.com/m/';

let results = [];
let randomWaitTime;

module.exports = {
    scrape: async function scrape(user) {
        console.log("Starting scrape...");
        console.log("Launching headless browser...")
        const browser1 = await puppeteer.launch({ headless: true });
        const browser2 = await puppeteer.launch({ headless: true });
        let pageBrowser1 = await browser1.newPage();
        let pageBrowser2 = await browser2.newPage();
    
        // Open login page and login
        console.log("Loading Netflix login page...")
        await pageBrowser1.goto(netflixLoginPage);
        await pageBrowser1.type('#id_userLoginId', user.username);
        await pageBrowser1.type('#id_password', user.password);
        await pageBrowser1.keyboard.press('Enter');
        console.log("Logging in to Netflix...");
        await pageBrowser1.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });
    
        // const indexOfUserAccount = await pageBrowser1.evaluate((profile) => {
        //     let userAccounts = document.querySelector("#appMountPoint > div > div > div:nth-child(1) > div.bd.dark-background > div.profiles-gate-container > div > div > ul").children;
    
        //     // Default user profile index.
        //     let index = 0;
    
        //     for (let i = 0; i < userAccounts.length; i++) {
        //         if (userAccounts[i].innerText === profile) {
        //             index = i;
        //             break;
        //         }
        //     }
    
        //     return index + 1;
        // }, user.profile);

        // // Click the user account if the user entered a correct account name. Otherwise, choose 1st account.
        // await pageBrowser1.click('li.profile:nth-child(' + indexOfUserAccount + ') > div:nth-child(1) > a:nth-child(1)');
        // console.log("Loading user profile...");
        // await pageBrowser1.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });

        await clickUserProfile(pageBrowser1, user);

        await pageBrowser1.goto(netflixMoviesPage, { waitUntil: 'networkidle2', timeout: 0 });

        // Click the 'Genres' drop-down menu
        await pageBrowser1.click('div[label="Genres"] > div');
        console.log("Loading movie genres...");

        const codes = await pageBrowser1.evaluate(() => {
            let anchors = document.querySelectorAll('div[label="Genres"] > div + div li > a');
            let codes = [];

            for (let a of anchors) {
                let genre = {
                    name: a.innerText,
                    code: a.pathname.substr(a.pathname.lastIndexOf('/') + 1)
                }

                codes.push(genre);
            }

            return codes;
        });
    
        for (let c of codes) {
            console.log("Loading genre: " + c.name + " - " + c.code);
            await pageBrowser1.goto(netflixMoviesBaseUrl + c.code + netflixMoviesExtraParams, { waitUntil: 'networkidle2', timeout: 0 });
            let profileSelectionRequired = await pageBrowser1.evaluate(() => {
                let profileDiv = document.querySelector('.list-profiles');
                if (profileDiv === null) {
                    return false;
                } else {
                    return true;
                }
            });

            if (profileSelectionRequired) {
                console.log("User profile needed...");
                await clickUserProfile(pageBrowser1, user);
                console.log("Reloading genre: " + c.name + " - " + c.code);
                await pageBrowser1.goto(netflixMoviesBaseUrl + c.code + netflixMoviesExtraParams, { waitUntil: 'networkidle2', timeout: 0 });
            } 

            results = await scrapeMovies(pageBrowser1, pageBrowser2, extractItems, results);
        }
    
        console.log("Completed scraping Netflix movies.");

        browser1.close();
        browser2.close();
    
        return results;
    }
};

function extractItems() {
    const extractedElements = document.querySelectorAll('p.fallback-text');
    const items = [];
    extractedElements.forEach(function (element) {
        items.push(element.innerText);
    });
    return items;
}

async function scrapeMovies(
    pageBrowser1,
    pageBrowser2,
    extractItems,
    results,
    scrollDelay = 1000,
) {
    console.log("Scraping page.");

    let movieTitles = [];
    try {
        let previousHeight;
        while (movieTitles.length < 1000000000000) {
            movieTitles = await pageBrowser1.evaluate(extractItems);
            previousHeight = await pageBrowser1.evaluate('document.body.scrollHeight');
            await pageBrowser1.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await pageBrowser1.waitForFunction(`document.body.scrollHeight > ${previousHeight}`, { timeout: 3000 });
            await pageBrowser1.waitFor(scrollDelay);
        }
    } catch (e) { }

    if (movieTitles.length === 0) {
        console.log("No movies in this category.");
    }

    for (let i = 0; i < movieTitles.length; i++) {
        if (!movieExists(results, movieTitles[i])) {
            let movie = new Object();
            movie.title = movieTitles[i];

            let rtFmtMovieTitle = movie.title.replace(/[^a-z0-9\s-]/ig,'').trim().replace(/\s+/g, '_').toLowerCase();

            await pageBrowser2.goto(rottenTomatoesBaseUrl + rtFmtMovieTitle, { waitUntil: 'domcontentloaded', timeout: 0 });

            console.log("Loaded " + movie.title + " on Rotten Tomatoes.");

            console.log('Scraping tomato information...');

            let tomatometer = await pageBrowser2.evaluate(() => {
                try {
                    return document.querySelector("#tomato_meter_link > span.mop-ratings-wrap__percentage").innerText;
                } catch {
                    return 'N/A';
                }
            });

            if (tomatometer !== undefined && tomatometer !== null && tomatometer !== '') {
                movie.tomatometer = tomatometer;
            } else {
                movie.tomatometer = 'N/A';
            }

            let reviewCount = await pageBrowser2.evaluate(() => {
                try {
                    return document.querySelector("#topSection > div.col-sm-17.col-xs-24.score-panel-wrap > div.mop-ratings-wrap.score_panel.js-mop-ratings-wrap > section > section > div:nth-child(1) > div > small").innerText;
                } catch {
                    return 'N/A';
                }
            });

            if (reviewCount !== undefined && reviewCount !== null && reviewCount !== '') {
                movie.reviewCount = reviewCount;
            } else {
                movie.reviewCount = 'N/A';
            }

            console.log("Movie has been scraped.")
            console.log("Title: " + movie.title + " | Tomatometer: " + tomatometer + " | Review count: " + reviewCount);

            results.push(movie);
        }
    }

    return results;
}

function movieExists(arrOfMovieObjects, nameOfMovie) {
    return arrOfMovieObjects.some(movieObject => nameOfMovie === movieObject.title);
}

async function clickUserProfile(page, user) {
    const indexOfUserAccount = await page.evaluate((profile) => {
        let userAccounts = document.querySelector("#appMountPoint > div > div > div:nth-child(1) > div.bd.dark-background > div.profiles-gate-container > div > div > ul").children;

        // Default user profile index.
        let index = 0;

        for (let i = 0; i < userAccounts.length; i++) {
            if (userAccounts[i].innerText === profile) {
                index = i;
                break;
            }
        }

        return index + 1;
    }, user.profile);

    // Click the user account if the user entered a correct account name. Otherwise, choose 1st account.
    await page.click('li.profile:nth-child(' + indexOfUserAccount + ') > div:nth-child(1) > a:nth-child(1)');
    console.log("Loading user profile...");
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });
}