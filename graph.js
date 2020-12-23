const superagent = require("superagent");
const parseString = require("xml2js").parseString;
const util = require("util");
const { timeStamp } = require("console");

/* Returns JS object containing the NFL games in a given week */
async function fetchGames(year, week) {
    let ret;
    await superagent.get("https://nflcdns.nfl.com/ajax/scorestrip")
    .accept("xml")
    .query({
        season: String(year),
        seasonType: "REG",
        week: String(week)
    })
    .then(response => {
        parseString(response.text, (error, result) => {
            ret = result.ss.gms[0].g;
        });
    })
    .catch(error => {});
    return ret;
}

/* Definition for instantiated team objects */
class Node {
    constructor(name) {
        this.name = name;
        this.wins = new Set();
    }
}

/* Returns directed graph.
   Nodes represent teams, edges point to defeated teams */
async function buildGraph(year) {
    const nfl = new Map();
    for (let i = 1; i <= 17; i++) {
        const slate = await fetchGames(year, i);
        for (game of slate) {
            game = game["$"];
            if (!nfl.has(game.hnn)) nfl.set(game.hnn, new Node(game.hnn));
            if (!nfl.has(game.vnn)) nfl.set(game.vnn, new Node(game.vnn));
            if (Number(game.hs) > Number(game.vs)) {
                nfl.get(game.hnn).wins.add(nfl.get(game.vnn));
            }
            else if (Number(game.vs) > Number(game.hs)) {
                nfl.get(game.vnn).wins.add(nfl.get(game.hnn));
            }
        }
    }
    return nfl;
}

const year = 2020;
async function test() {
    const check = await buildGraph(year);
    console.log(check);
}
test();
