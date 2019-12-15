var scrollInterval = setInterval(function() { 
    document.documentElement.scrollTop = document.documentElement.scrollHeight;
}, 50);

var stopScroll = function() { clearInterval(scrollInterval); };

stopScroll();

var numberOfRows = document.querySelector("div.galleryLockups").children.length;

var numberOfSliderItems = 6;

var movieName = document.querySelector("#row-0 div.slider-item-0 p.fallback-text").textContent;

// Main scraper function; Async so that await can be used to prevent loop from continuing execution until page load and page scrapes are complete
async function runScraper() {
    await scrollToBottom();
    console.log("Finished scrolling to bottom");

}

// Scrolls to bottom of netflix page after loading all movies.
function scrollToBottom() {
    return new Promise(resolve => {
        var scrollingElement = (document.scrollingElement || document.body);
        var height = scrollingElement.scrollHeight;

        console.log("Height is " + height);

        var scrollInterval = setInterval(function() { 
            document.documentElement.scrollTop = document.documentElement.scrollHeight;
            height = scrollingElement.scrollHeight;
            if (height >= 61505) {
                clearInterval(scrollInterval);
                resolve("");
            }
        }, 1);
    });
}