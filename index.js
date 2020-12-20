#!/usr/bin/env node
const readline = require('readline');
const { buildGraph, drawGraph, makeGuess } = require('./mine-sweeper') 
const l = process.argv.length;
const height = process.argv[l - 2];
const width = process.argv[l-1]
const numBombs = 2;
const graph = buildGraph(height, width, numBombs)
const guesses = new Set()
console.log(drawGraph(graph, guesses))
var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt('select cell "x y":  ');
rl.prompt();
rl.on('line', function(line) {
    const [x, y] = line.split(' ')
    guesses.add(`${x}_${y}`)
    let bombFound = makeGuess(graph, x, y)
    console.log(drawGraph(graph, guesses))
    if (guesses.size === height * width - numBombs) {
        console.log('YOU WIN')
        rl.close();
    }
    else if (bombFound) {
        rl.close();
    }
    rl.prompt();
}).on('close',function() {
    
    process.exit(0);
});
