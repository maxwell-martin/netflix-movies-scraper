#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question1() {
    return new Promise(resolve => {
        rl.question('What is your Netflix username? ', (username) => {
            resolve(username.trim());
        });
    });
}

function question2() {
    return new Promise(resolve => {
        rl.question('What is your Netflix password? ', (password) => {
            resolve(password.trim());
        });
    });
}

let user, netflixUsername, netflixPassword, validUsername = false, validPassword = false;

const main = async () => {
    while (!validUsername) {
        netflixUsername = await question1();
        if (netflixUsername !== undefined && netflixUsername !== null && netflixUsername !== '') {
            validUsername = true;
        }
    }

    while (!validPassword) {
        netflixPassword = await question2();
        if (netflixPassword !== undefined && netflixPassword !== null && netflixPassword !== '') {
            validPassword = true;
        }
    }

    rl.close();

    user = {
        username: netflixUsername,
        password: netflixPassword
    };

    fs.writeFileSync('config.json', JSON.stringify(user));
};