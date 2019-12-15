const puppeteer = require('puppeteer');

// const netflixCodesUrl = 'https://www.netflix-codes.com/';
const netflixCodesUrl = 'https://www.techadvisor.co.uk/how-to/photo-video/how-view-all-films-on-netflix-make-netflix-easier-browse-3633396/';
const netflixMoviesBaseUrl = 'https://www.netflix.com/browse/genre/';
const netflixMoviesExtraParams = '?so=az';
const netflixLoginPage = ''
let results = [];

(async () => {
    console.log("Entered async function.");
    let browser = await puppeteer.launch( { headless: false } );
    let page = await browser.newPage();

    await page.goto(netflixCodesUrl, { waitUntil: 'networkidle2', timeout: 0 });
    console.log("Loaded Netflix codes page.");
    
    let arrOfNetflixCodes = await page.evaluate(() => {
        console.log("Evaluating Netflix codes page.");
        var codesParagraphTextContent = document.querySelector("#articleBody > p:nth-child(18)").textContent;
        let arrTextCodes = codesParagraphTextContent.match(/\([0-9]+\)/g);
        // let nodeListCodes = document.querySelectorAll('a[class="link_to_netflix"] > code');

        // nodeListCodes.forEach(function(currentValue, currentIndex, listObj) {
        //     if (currentValue.innerText !== 'CODE' && currentValue.innerText !== null && currentValue.innerText !== '') {
        //         arrTextCodes.push(currentValue.innerText);
        //     }
        // })

        return arrTextCodes;
    });

    console.log("Done with Netflix codes page.");

    await page.goto('')

    for (i = 0; i < arrOfNetflixCodes.length; i++) {
        let currentValue = arrOfNetflixCodes[i].substr(1, arrOfNetflixCodes[i].lastIndexOf(')') - 1);
        await page.goto(netflixMoviesBaseUrl + currentValue + netflixMoviesExtraParams, { waitUntil: 'networkidle2', timeout: 0 });
        console.log("Loaded " + currentValue);

        await page.evaluate(async (currentValue) => {
            console.log("Evaluating " + currentValue);

            const scrollToBottom = () => {
                return new Promise(resolve => {
                    console.log(document);
                    var scrollingElement = (document.scrollingElement || document.body);
                    console.log(scrollingElement);
                    var height = scrollingElement.scrollHeight;
                    console.log(height);
            
                    var scrollInterval = setInterval(function() { 
                        document.documentElement.scrollTop = document.documentElement.scrollHeight;
                        height = scrollingElement.scrollHeight;
                        if (height >= 61505) {
                            clearInterval(scrollInterval);
                            resolve("");
                        }
                    }, 50);
                });
            }

            const scrapeNetflixPage = () => {
                return new Promise(resolve => {
                    var numberOfRows = document.querySelector('div.galleryLockups').children.length;
            
                    for (i = 0; i < numberOfRows; i++) {
                        var numberOfSliderItems = document.querySelector('div#row-' + i + ' div.sliderContent').children.length;
                        for (j = 0; j < numberOfSliderItems; i++) {
                            var movieName = document.querySelector('#row-' + i + ' div.slider-item-' + j + ' p.fallback-text').textContent;
                            var row = [];
                            row.push(movieName);
                            results.push(row);
                        }
                    }
            
                    resolve("");
                });
            }

            if (document.querySelector('div[class="galleryMessage"]') === null) {
                console.log(currentValue + " page has data.");
                await scrollToBottom();
                console.log("Completed scrolling to bottom.");
                await scrapeNetflixPage();
                console.log("Scraped " + currentValue + ". Going to next page.");
            }
            else {
                console.log(currentValue + " has no data.");
            }
        }, currentValue);
    }

    console.log("Completed scraping Netflix movies.");

    console.log(results);

    await browser.close();
})();

// // Scrolls to bottom of netflix page after loading all movies.
// function scrollToBottom(doc) {
//     return new Promise(resolve => {
//         console.log(doc);
//         var scrollingElement = (doc.scrollingElement || doc.body);
//         console.log(scrollingElement);
//         var height = scrollingElement.scrollHeight;
//         console.log(height);

//         var scrollInterval = setInterval(function() { 
//             doc.documentElement.scrollTop = doc.documentElement.scrollHeight;
//             height = scrollingElement.scrollHeight;
//             if (height >= 61505) {
//                 clearInterval(scrollInterval);
//                 resolve("");
//             }
//         }, 50);
//     });
// }

// function scrapeNetflixPage(doc) {
//     return new Promise(resolve => {
//         var numberOfRows = doc.querySelector('div.galleryLockups').children.length;

//         for (i = 0; i < numberOfRows; i++) {
//             var numberOfSliderItems = doc.querySelector('div#row-' + i + ' div.sliderContent').children.length;
//             for (j = 0; j < numberOfSliderItems; i++) {
//                 var movieName = doc.querySelector('#row-' + i + ' div.slider-item-' + j + ' p.fallback-text').textContent;
//                 var row = [];
//                 row.push(movieName);
//                 results.push(row);
//             }
//         }

//         resolve("");
//     });
// }

// function pageHasData(doc) {
//     return doc.querySelector('div[class="galleryMessage"]') === null ? true : false;
// }

