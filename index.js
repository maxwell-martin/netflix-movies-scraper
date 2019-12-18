#!/usr/bin/env node

const readline = require('readline');
const scraper = require('./scraper.js');
const ObjectsToCsv = require('objects-to-csv');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askForUsername() {
    return new Promise(resolve => {
        rl.question('What is your Netflix username? ', (username) => {
            resolve(username.trim());
        });
    });
}

function askForPassword() {
    return new Promise(resolve => {
        rl.question('What is your Netflix password? ', (password) => {
            resolve(password.trim());
        });
    });
}

function askForProfile() {
    return new Promise(resolve => {
        rl.question('What Netflix profile do you want to use? ', (profile) => {
            resolve(profile.trim());
        });
    });
}

let user, netflixUsername, netflixPassword, netflixProfile;
let validUsername = false, validPassword = false, validProfile = false;

(async () => {
    // while (!validUsername) {
    //     netflixUsername = await askForUsername();
    //     if (netflixUsername !== undefined && netflixUsername !== null && netflixUsername !== '') {
    //         validUsername = true;
    //     }
    // }

    // while (!validPassword) {
    //     netflixPassword = await askForPassword();
    //     if (netflixPassword !== undefined && netflixPassword !== null && netflixPassword !== '') {
    //         validPassword = true;
    //     }
    // }

    // while (!validProfile) {
    //     netflixProfile = await askForProfile();
    //     if (netflixProfile !== undefined && netflixProfile !== null && netflixProfile !== '') {
    //         validProfile = true;
    //     }
    // }

    rl.close();

    // user = {
    //     username: netflixUsername,
    //     password: netflixPassword,
    //     profile: netflixProfile
    // };

    user = {
        username: 'cr3ativegirl@gmail.com',
        password: '6bg5Et!z30@T',
        profile: 'Max'
    };

    const results = await scraper.scrape(user);

    console.log("Creating csv file...")
    const today = new Date();
    let month = (today.getMonth() + 1).toString();
    let day = today.getDate().toString();
    let year = today.getFullYear().toString().substring(2,4);
    let strDate = month + day + year;
    const csvFileName = 'netflix-movies-as-of' + strDate + '.csv';
    const csv = new ObjectsToCsv(results);
    await csv.toDisk('./' + csvFileName);

    console.log("A CSV file named " + csvFileName + " with all movie information has been created in this project's folder.");

    process.exitCode = 1;
})();