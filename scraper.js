const puppeteer = require('puppeteer');
const request = require('request-promise');
const getApiKey = require('./get-api-key.js');

const netflixMoviesBaseUrl = 'https://www.netflix.com/browse/genre/';
const netflixMoviesExtraParams = '?so=az';
const netflixLoginPage = 'https://www.netflix.com/login';
const netflixMoviesPage ='https://www.netflix.com/browse/genre/34399';
const omdbApiBaseUrl = 'http://www.omdbapi.com/';

let results = [];
let numberOfRequestsToOmdbApi = 0;

module.exports = {
    scrape: async function scrape(user) {
        user.apiKey = await getApiKey.getApiKey();

        console.log("Starting scrape...");
        console.log("Launching headless browser...")
        const browser = await puppeteer.launch({ headless: true });
        let page = await browser.newPage();

        await page.setViewport({ width: 1280, height: 800 });
    
        // Open login page and login
        console.log("Loading Netflix login page...")
        await page.goto(netflixLoginPage);
        await page.type('#id_userLoginId', user.username);
        await page.type('#id_password', user.password);
        await page.keyboard.press('Enter');
        console.log("Logging in to Netflix...");
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });
    
        await clickUserProfile(page, user);

        await page.goto(netflixMoviesPage, { waitUntil: 'networkidle2', timeout: 0 });

        // Click the 'Genres' drop-down menu
        await page.click('div[label="Genres"] > div');
        console.log("Loading movie genres...");

        const codes = await page.evaluate(() => {
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
            await page.goto(netflixMoviesBaseUrl + c.code + netflixMoviesExtraParams, { waitUntil: 'networkidle2', timeout: 0 });
            let profileSelectionRequired = await page.evaluate(() => {
                let profileDiv = document.querySelector('.list-profiles');
                if (profileDiv === null) {
                    return false;
                } else {
                    return true;
                }
            });

            if (profileSelectionRequired) {
                console.log("User profile needed...");
                await clickUserProfile(page, user);
            } 

            results = await scrapeMovies(page, extractItems, results, user);
        }
    
        console.log("Completed scraping Netflix movies.");

        browser.close();
    
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
    page,
    extractItems,
    results,
    user,
    scrollDelay = 1000,
) {
    console.log("Scraping page.");

    let movieTitles = [];
    try {
        let previousHeight;
        while (movieTitles.length < 1000000000000) {
            movieTitles = await page.evaluate(extractItems);
            previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`, { timeout: 3000 });
            await page.waitFor(scrollDelay);
        }
    } catch (e) { }

    if (movieTitles.length === 0) {
        console.log("No movies in this category.");
    }

    for (let i = 0; i < movieTitles.length; i++) {
        if (!movieExists(results, movieTitles[i])) {
            let movie = new Object();
            movie.title = movieTitles[i];

            if (numberOfRequestsToOmdbApi === 999) {
                user.apiKey = await getApiKey.getApiKey();
                numberOfRequestsToOmdbApi = 0;
            }

            const requestOptions = {
                method: 'GET',
                url: omdbApiBaseUrl,
                qs: {
                    t: movie.title,
                    apiKey: user.apiKey
                },
                json: true
            }

            console.log("Request Options:");
            console.log(requestOptions);

            console.log("Requesting information about " + movie.title +" from Omdb API...");

            let resultJSON;
            try {
                resultJSON = await request(requestOptions);
                console.log("Result JSON:");
                console.log(resultJSON);
                numberOfRequestsToOmdbApi++
            } catch {
                resultJSON = 'False';
            }
            
            if (resultJSON!== 'False' && resultJSON !== undefined && resultJSON !== null && resultJSON !== '') {
                console.log("Response from OMDB passes checks.");

                if (resultJSON.hasOwnProperty('imdbRating')) {
                    movie.imdbRating = resultJSON.imdbRating;
                    console.log("IMDB Rating: " + movie.imdbRating);
                } else {
                    movie.imdbRating = 'N/A';
                    console.log("No IMDB Rating property.");
                }

                if (resultJSON.hasOwnProperty('imdbVotes')) {
                    movie.imdbVotes = resultJSON.imdbVotes;
                    console.log("IMDB Votes: " + movie.imdbVotes);
                } else {
                    movie.imdbVotes = 'N/A';
                    console.log("No IMDB Votes property.");
                }

                movie.tomatometer = 'N/A';
                if (resultJSON.hasOwnProperty('Ratings')) {
                    for(let obj of resultJSON.Ratings) {
                        if (obj.Source === 'Rotten Tomatoes') {
                            movie.tomatometer = obj.Value;
                            break;
                        }
                    }
                }
                console.log("Tomatometer: " + movie.tomatometer);

                console.log("Movie has been scraped.")
                console.log("Title: " + movie.title + " | ImdbRating: " + movie.imdbRating + " | ImdbVotes: " + movie.imdbVotes + " | Tomatometer: " + movie.tomatometer);

                results.push(movie);
            } else {
                console.log("Failed to get movie information from Omdb API. Requesting next movie...");
            }
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