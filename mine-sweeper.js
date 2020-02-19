
const BOMB = -1
const BLANK = 0

const drawGraph =(graph, guessSet) => {
    let result = ''
    for (let i = 0; i < graph.length; i++) {
        for (let j = 0; j < graph[i].length; j++) {
            const val = graph[i][j]
            const key = `${i}_${j}`
            if (guessSet.has(key)) {
                switch (val) {
                    // case BLANK:
                    //     result += ' _ '
                    //     break;
                    case BOMB:
                        result += " X "
                        break;
                    default:
                        result += ` ${val} `
                        break;
                }
            }
            else {
                result += ' _ ';
            }
        }
        result += '\n'
    }
    return result
}

const addBombs = (graph, numBombs) => {
    height = graph.length
    width = graph[0].length
    while (numBombs > 0) {
        yPos = Math.floor(Math.random() * height)
        xPos = Math.floor(Math.random() * width)
        cell = graph[yPos][xPos]
        if (cell == BLANK) {
            graph[yPos][xPos] = BOMB
            numBombs--;
        }
    }
    return graph;
}

const addCounts = (graph) => {
    const isBomb = (i,j) => {
        if (i < 0 || i >= graph.length) {
            return 0;
        }
        if (j < 0 || j >= graph[0].length) {
            return 0;
        }
        return graph[i][j] == BOMB ? 1: 0
    }
    for (let i = 0; i < graph.length; i++) {
        for (let j = 0; j < graph[i].length; j++) {
            switch (graph[i][j]) {
                case BOMB:
                    continue
                case BLANK:
                    let count = 0
                    count += isBomb(i-1,j-1)
                    count += isBomb(i-1,j)
                    count += isBomb(i-1,j+1)
                    count += isBomb(i,j+1)
                    count += isBomb(i+1,j+1)
                    count += isBomb(i+1,j)
                    count += isBomb(i+1,j-1)
                    count += isBomb(i,j-1)
                    graph[i][j] = count
                    break
                default:
                    console.log('bad iteration')
                    break;
            }
        }
    }
    return graph
}


const buildGraph = (height, width, numBombs=1) => {
    let graph = []
    for (let i = 0; i < height; i++) {
        let row = []
        for (let j = 0; j < width; j++) {
            row.push(BLANK)
        }
        graph.push(row)
    }
    graph = addBombs(graph, numBombs);
    graph = addCounts(graph)
    return graph
}

const makeGuess = (graph, x, y) => graph[x][y] == BOMB;

module.exports = {
    buildGraph,
    makeGuess,
    drawGraph
};