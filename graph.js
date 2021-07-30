const superagent = require("superagent");
const parseString = require("xml2js").parseString;
const util = require("util");

/* Returns JS object containing the NFL games in a given week */
async function fetchGames(year, week) {
  let ret;
  await superagent
    .get("https://nflcdns.nfl.com/ajax/scorestrip")
    .accept("xml")
    .query({
      season: String(year),
      seasonType: "REG",
      week: String(week),
    })
    .then((response) => {
      parseString(response.text, (error, result) => {
        ret = result.ss.gms[0].g;
      });
    })
    .catch((error) => {});
  return ret;
}

/* Definition for instantiated team objects */
class Node {
  constructor(name) {
    this.name = name;
    this.wins = new Set();
  }
}

/* Returns directed graph (adjacency list).
   Nodes represent teams, edges point to defeated teams */
async function buildGraph(year) {
  const nfl = new Map();
  // maximum regular season length is 17 weeks, instituted in 1990
  for (let i = 1; i <= 17; i++) {
    const slate = await fetchGames(year, i);
    if (slate !== undefined) {
      for (game of slate) {
        game = game["$"];
        if (!nfl.has(game.hnn)) nfl.set(game.hnn, new Node(game.hnn));
        if (!nfl.has(game.vnn)) nfl.set(game.vnn, new Node(game.vnn));
        if (Number(game.hs) > Number(game.vs)) {
          nfl.get(game.hnn).wins.add(nfl.get(game.vnn));
        } else if (Number(game.vs) > Number(game.hs)) {
          nfl.get(game.vnn).wins.add(nfl.get(game.hnn));
        }
      }
    }
  }
  return nfl;
}

function isValid(team, nfl, cycle) {
  if (nfl.get(cycle[cycle.length - 1]).wins.has(nfl.get(team))) {
    for (let i = 0; i < cycle.length; i++) {
      if (team === cycle[i]) return false;
    }
    return true;
  }
  return false;
}

function search(nfl, cycle) {
  if (cycle.length == nfl.size) {
    return nfl.get(cycle[cycle.length - 1]).wins.has(nfl.get(cycle[0]));
  }

  for ([team, data] of nfl) {
    if (isValid(team, nfl, cycle)) {
      cycle.push(team);
      if (search(nfl, cycle)) return true;
      cycle.pop();
    }
  }
  return false;
}

function findCycle(nfl) {
  const cycle = [];

  cycle.push("falcons");
  if (search(nfl, cycle, 1)) {
    let toPrint = "Cycle found:\n";
    for (let i = 0; i < cycle.length - 1; i++) {
      toPrint += `${cycle[i]} beat ${cycle[i + 1]}\n`;
    }
    toPrint += `${cycle[cycle.length - 1]} beat ${cycle[0]}\n`;
    console.log(toPrint);
  } else {
    console.log("No Hamiltonian cycle exists.\n");
  }
}

async function init(year) {
  console.log("Initializing graph\n");
  const nfl = await buildGraph(year);
  console.log("Graph built. Looking for cycle...\n");
  findCycle(nfl);
}

const year = 2020;
init(year);
