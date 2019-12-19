# Netflix Movies Scraper
This project scrapes "all" movies from Netflix based on the main netflix genres, gathers information about each movie from the OMDB database, and downloads all data to a csv file in the project folder. To do this, I use Node.js and Puppeteer, and I gather movie information by making requests to the OMDB API. Sometimes the movie title from taken from Netflix is the same as another movie that is older or newer. When movie data is requested from OMDB, OMDB returns the latest movie. Version 2.0.0 will be where I gather the movie year from Netflix and use it with the title to make more accurate requests to OMDB.

## How do you use this?
1. If you do not have Node.js, download it.
2. Clone repository.
3. Unzip downloaded directory.
4. Change into the directory via command line.
5. Type: `npm ci`. This will clean install the project and download the required modules. You should see a folder called 'node_modules' now inside the directory.
6. Option 1: Install project globally to NPM - Type in command line: `npm install -g .`. Now, type in `netflix-movies-scraper` and click enter.
7. Option 2: Run project without installing to NPM - Type in command line: `node .\index.js` and click enter.
8. You will be prompted via the command line to enter your Netflix username, password, and profile name. Answer each question by typing in your response and clicking enter. After the last question, the program will begin scraping. If you are worried about entering in your username and password, please read the code. A valid username and password is required so that Puppeteer can login to Netflix via the headless browser and begin scraping.
9. View project status in command line.
10. When project is done, you will have a CSV file inside the directory called `netflix-movies-as-of-DATE.csv`

## Whose code and which websites/articles did I view when making this program?
The names and links below are my attempt to give credit to those whose public information/code helped me. I also spent a lot of time on Stack Overflow figuring out how to do things. I have only included links from Stack Overflow related to Puppeteer, Node.js, or an NPM module.
- Robert James Gabriel
  - https://dev.to/robertjgabriel/a-puppeteer-script-to-discover-and-download-all-netflix-categories-in-a-json-file-2md6
  - https://github.com/RobertJGabriel/netflix-categories
- John Untivero
  - https://gist.github.com/x43romp/2336deec8b533695cd2d
  - https://gist.githubusercontent.com/x43romp/2336deec8b533695cd2d/raw/c922e067b097e5e4cc39b37f1af0f62396edf3f7/NetflixCodes.json
- Fabian Grohs
  - https://www.youtube.com/watch?v=4q9CNtwdawA
- Andre Perunicic
  - https://intoli.com/blog/scrape-infinite-scroll/
- Eric Bidelman
  - https://www.youtube.com/watch?v=lhZOFUY1weo
- Scott Robinson
  - https://stackabuse.com/reading-and-writing-json-files-with-node-js/
- Tendai Mutunhire
  - https://stackabuse.com/writing-to-files-in-node-js/
- Stack Overflow
  - https://stackoverflow.com/questions/46088351/puppeteer-pass-variable-in-evaluate
  - https://stackoverflow.com/questions/46919013/puppeteer-wait-n-seconds-before-continuing-next-line
- Miscellaneous
  - https://developers.google.com/web/tools/puppeteer
  - https://code.visualstudio.com/docs/nodejs/nodejs-tutorial
  - https://pptr.dev/
  - https://www.npmjs.com/package/objects-to-csv
  - https://github.com/request/request-promise/issues/132
  - https://github.com/request/request-promise/issues/109
  - https://www.npmjs.com/package/request-promise