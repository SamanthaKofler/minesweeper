'use strict';
var MINE = '💣';
var FLAG = '🚩';
var gBoard;


var gLevel = {
    SIZE: 8,
    MINES: 12
}

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 3,
    hints: 3
}

function init() {
    gBoard = createBoard(gLevel.SIZE);
    renderBoard(gBoard);
    renderLives(gGame.lives);
    renderHints(gGame.hints);
    gGame.isOn = true;
}

function setLevel(size, mines) {
    gLevel = { SIZE: size, MINES: mines };
    restart();
}

function createBoard(size) {
    var board = [];
    for (var i = 0; i < size; i++) {
        board[i] = [];
        for (var j = 0; j < size; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
    return board;
}

function renderBoard(board) {
    var strHtml = '';
    for (var i = 0; i < board.length; i++) {
        strHtml += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            currCell.minesAroundCount = countNeighbors(i, j);
            if (!currCell.isShown) {
                strHtml += `<td id="cell-${i}-${j}" class="covered`
                if (!currCell.isMine) {
                    strHtml += `" onclick="cellClicked(${i}, ${j})" onmousedown="rightclick(event,${i},${j})" oncontextmenu="javascript:return false;"><span class="hidden">${currCell.minesAroundCount}`;
                } else {
                    // add class "mine"
                    strHtml += ` mine" onclick="cellClicked(${i}, ${j})" onmousedown="rightclick(event,${i},${j})" oncontextmenu="javascript:return false;"><span class="hidden">${MINE}`;
                }
                strHtml += '</span></td>';
            } else {
                // the first clicked cell is already revealed and shall therefore not have the class "covered"
                strHtml += `<td id="cell-${i}-${j}" onclick="cellClicked(${i}, ${j})" onmousedown="rightclick(event,${i},${j})" oncontextmenu="javascript:return false;"><span class="hidden">${currCell.minesAroundCount}</span></td>`
            }
        }
        strHtml += '</tr>';
    }
    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHtml;
}

function renderHints(amount) {
    var strHtml = '';
    for (var i = 0; i < amount; i++) {
        strHtml += `<img data-i="${i}" onclick="getHint()" src="img/lightbulb.png">`;
    }
    var elHints = document.querySelector('.hints');
    elHints.innerHTML = strHtml;
}

function renderLives(amount) {
    var strHtml = '';
    for (var i = 0; i < amount; i++) {
        strHtml += '💖';
    }
    var elLives = document.querySelector('.lives');
    elLives.innerText = strHtml;
}

function putMines(amount) {
    for (var i = 0; i < amount; i++) {
        var mine = getRandomEmptyCell();
        mine.isMine = true;
        mine.minesAroundCount = null;
    }
    renderBoard(gBoard);
}

function getRandomEmptyCell() {
    var isFound = false;
    while (!isFound) {
        var idxI = getRandomInt(0, gBoard.length);
        var idxJ = getRandomInt(0, gBoard.length);
        if (!gBoard[idxI][idxJ].isShown && !gBoard[idxI][idxJ].isMine) isFound = true;
    }
    return gBoard[idxI][idxJ];
}

function countNeighbors(posI, posJ) {
    var negsCount = 0;
    for (var i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = posJ - 1; j <= posJ + 1; j++) {
            if (j < 0 || j >= gBoard.length) continue;
            if (i === posI && j === posJ) continue;
            if (gBoard[i][j].isMine) negsCount++;
        }
    }
    return negsCount;
}

function cellClicked(i, j) {
    var currCell = gBoard[i][j];
    if (currCell.isShown) return;
    if (gGame.isOn) {
        currCell.isShown = true;
        var elCell = document.querySelector('#cell-' + i + '-' + j)
        // on first click start game and put mines
        if (gGame.shownCount === 0) {
            putMines(gLevel.MINES);
            startTimer();
            elCell.classList.remove('covered');
            if (currCell.minesAroundCount === 0) {
                expandShown(i, j);
            }
        }
        var elSpan = document.querySelector('#cell-' + i + '-' + j + ' span');
        if (!currCell.isMine) {
            gGame.shownCount++;
            // make the cell visible
            elCell.classList.remove('covered');
            elSpan.classList.remove('hidden');
            elSpan.classList.add('shown');
            if (currCell.minesAroundCount === 0) {
                elSpan.innerText = null;
                expandShown(i, j);
            }
            checkVictory();
        }
        if (currCell.isMine) {
            currCell.isShown = false;
            gGame.lives--;
            // var elLives = document.querySelector('.lives');
            // if no lives left, game over
            if (gGame.lives === 0) {
                renderLives(gGame.lives);
                elCell.classList.remove('covered');
                gameOver();
            } else {
                // indicate lost life
                elCell.classList.add('lose-life');
                elCell.classList.remove('covered');
                setTimeout(function () {
                    elCell.classList.remove('lose-life');
                    elCell.classList.add('covered');
                }, 1000);
                // update lives
                renderLives(gGame.lives);
            }
        }
    } else {
        showHint(i, j);
    }
}

function expandShown(posI, posJ) {
    // neighbors loop
    for (var i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = posJ - 1; j <= posJ + 1; j++) {
            if (j < 0 || j >= gBoard.length) continue;
            if (i === posI && j === posJ) continue;
            var currCell = gBoard[i][j];
            var elCell = document.querySelector('#cell-' + i + '-' + j);
            var elSpan = document.querySelector('#cell-' + i + '-' + j + ' span');
            if (!currCell.isShown) {
                currCell.isShown = true;
                gGame.shownCount++;
                elCell.classList.remove('covered')
                if (currCell.minesAroundCount === 0) {
                    expandShown(i, j);
                    elSpan.innerText = null;
                }
            }
            elSpan.classList.remove('hidden');
            elSpan.classList.add('shown');
        }
    }
    checkVictory();
}

function rightclick(e, i, j) {
    if (e.which === 3) {
        if (gGame.shownCount === 0 && gGame.markedCount === 0) {
            startTimer();
        }
        markCell(i, j);
    }
}

function markCell(i, j) {
    var currCell = gBoard[i][j];
    var elCell = document.querySelector('#cell-' + i + '-' + j);
    var elSpan = document.querySelector('#cell-' + i + '-' + j + ' span');
    // mark the cell with a flag
    if (!currCell.isMarked) {
        currCell.isMarked = true;
        gGame.markedCount++;
        elSpan.innerText = FLAG;
        elCell.classList.remove('covered');
        elSpan.classList.remove('hidden');
        elSpan.classList.add('shown');

    } else {
        // if cell is already marked, unmark it
        currCell.isMarked = false;
        gGame.markedCount--;
        elSpan.innerText = currCell.minesAroundCount;
        elSpan.classList.remove('shown');
        elSpan.classList.add('hidden');
        elCell.classList.add('covered');
    }
    checkVictory();
}

function gameOver() {
    gGame.isOn = false;
    stopTimer();
    // reveal all mines
    var elMineCells = document.querySelectorAll('.mine');
    var elMineSpans = document.querySelectorAll('.mine span');
    for (var i = 0; i < elMineCells.length; i++) {
        elMineSpans[i].classList.remove('hidden');
        elMineSpans[i].classList.add('shown');
        elMineCells[i].classList.remove('covered');
    }
    // update the smiley
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerText = '😵';
}

function checkVictory() {
    if (gGame.markedCount + gGame.shownCount === gLevel.SIZE ** 2) {
        gGame.isOn = false;
        stopTimer();
        // update the smiley
        var elSmiley = document.querySelector('.smiley');
        elSmiley.innerText = '🥳';
    }
}

function restart() {
    // reset the variables
    gGame.markedCount = 0;
    gGame.shownCount = 0;
    gGame.lives = 3;
    // reset timer
    gTimeBegan = null
    gTimeStopped = null
    gStoppedDuration = 0
    clearInterval(gTimerInterval);
    var timer = document.querySelector('.timer');
    timer.innerText = '00:00';
    // update the smiley
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerText = '🙂';
    init();
}

function getHint() {
    gGame.isOn = false;
    var elHint = document.querySelector('[data-i="' + (gGame.hints - 1) + '"]');
    elHint.classList.add('lighted');
}

function showHint(posI, posJ) {
    var negs = getNegsIncl(posI, posJ);
    for (var i = 0; i < negs.length; i++) {
        var elCell = document.querySelector(`#cell-${negs[i].i}-${negs[i].j}`);
        var elSpan = document.querySelector(`#cell-${negs[i].i}-${negs[i].j} span`);
        elSpan.classList.remove('hidden');
        elSpan.classList.add('shown');
        elCell.classList.remove('covered');
        elCell.classList.add('hint-reveal');

    }
    // remove hint after 1 sec
    setTimeout(function () {
        for (var i = 0; i < negs.length; i++) {
            var elCell = document.querySelector(`#cell-${negs[i].i}-${negs[i].j}`);
            var elSpan = document.querySelector(`#cell-${negs[i].i}-${negs[i].j} span`);
            elSpan.classList.add('hidden');
            elSpan.classList.remove('shown');
            elCell.classList.add('covered');
            elCell.classList.remove('hint-reveal');
        }
    gGame.hints--;
    renderHints(gGame.hints);
    }, 1000);
}

function getNegsIncl(posI, posJ) {
    var negs = [];
    for (var i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = posJ - 1; j <= posJ + 1; j++) {
            if (j < 0 || j >= gBoard.length) continue;
            var neg = { i: i, j: j };
            negs.push(neg);
        }
    }
    return negs;
}

// Timer:
var gTimeBegan = null
var gTimeStopped = null
var gStoppedDuration = 0
var gTimerInterval = null;

function startTimer() {
    if (gTimeBegan === null) {
        gTimeBegan = new Date();
    }
    if (gTimeStopped !== null) {
        gStoppedDuration += (new Date() - gTimeStopped);
    }
    gTimerInterval = setInterval(runTimer, 1);
}

function stopTimer() {
    gTimeStopped = new Date();
    clearInterval(gTimerInterval);
}

function runTimer() {
    var currentTime = new Date();
    var timeElapsed = new Date(currentTime - gTimeBegan - gStoppedDuration);
    var min = timeElapsed.getUTCMinutes();
    var sec = timeElapsed.getUTCSeconds();
    var timer = document.querySelector('.timer');
    timer.innerText =
        (min > 9 ? min : '0' + min) + ':' +
        (sec > 9 ? sec : '0' + sec);
}