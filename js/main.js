'use strict';
const MINE = '💣';
const FLAG = '🚩';
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
    hints: 3,
    safeClicks: 3,
    isLost: false,
    isManually: false,
    manualMines: 0
}

function init() {
    gBoard = createBoard(gLevel.SIZE);
    renderBoard(gBoard);
    renderLives(gGame.lives);
    renderHints(gGame.hints);
    showLocalStorage();
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
            var color = null;
            // adapt classes and span-content
            if (currCell.isMine) {
                var className = 'covered mine';
                var spanContent = MINE;
            } else {
                spanContent = currCell.minesAroundCount;
                // the first cell is already revealed
                if (currCell.isShown) className = 'revealed';
                else className = 'covered';
                // adapt the color of the mines-around-count
                if (currCell.minesAroundCount === 1) color = 'blue';
                else if (currCell.minesAroundCount === 2) color = 'green';
                else if (currCell.minesAroundCount === 3) color = 'red';
                else if (currCell.minesAroundCount === 4) color = 'purple';
                else if (currCell.minesAroundCount === 5) color = 'maroon';
                else if (currCell.minesAroundCount === 6) color = 'turquoise';
                else if (currCell.minesAroundCount === 7) color = 'black';
                else if (currCell.minesAroundCount === 8) color = 'gray';
            }
            if (color) {
                var colorStr = `style="color:${color};"`;
            } else colorStr = '';
            strHtml += `<td id="cell-${i}-${j}" class="${className}" ${colorStr} onclick="cellClicked(${i}, ${j})" onmousedown="rightclick(event,${i},${j})" oncontextmenu="javascript:return false;"><span class="hidden">${spanContent}</span></td>`;
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
    if (gGame.isLost) return;
    var currCell = gBoard[i][j];
    if (currCell.isShown) return;
    if (currCell.isMarked) return;
    // if in manual mode, place mines manually
    if (gGame.isManually && (gGame.manualMines < gLevel.MINES)) {
        putMineManually(i, j);
    }
    else if (gGame.isOn) {
        currCell.isShown = true;
        var elCell = document.querySelector('#cell-' + i + '-' + j)
        // on first click start game and put mines
        if (gGame.shownCount === 0) {
            if (!gGame.isManually) putMines(gLevel.MINES);
            startTimer();
            if (currCell.minesAroundCount === 0) expandShown(i, j);
        }
        var elSpan = document.querySelector('#cell-' + i + '-' + j + ' span');
        if (!currCell.isMine) {
            gGame.shownCount++;
            // make the cell visible
            elCell.classList.remove('covered');
            elCell.classList.add('revealed');
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
            // if no lives left, game over
            if (gGame.lives === 0) {
                renderLives(gGame.lives);
                elCell.classList.remove('covered');
                elCell.classList.add('revealed');
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
            // reveal the expansion and expand recursively
            var elCell = document.querySelector('#cell-' + i + '-' + j);
            var elSpan = document.querySelector('#cell-' + i + '-' + j + ' span');
            if (!currCell.isShown) {
                currCell.isShown = true;
                gGame.shownCount++;
                elCell.classList.remove('covered')
                elCell.classList.add('revealed');
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
    if (currCell.isShown) return;
    var elCell = document.querySelector('#cell-' + i + '-' + j);
    var elSpan = document.querySelector('#cell-' + i + '-' + j + ' span');
    // mark the cell with a flag
    if (!currCell.isMarked) {
        currCell.isMarked = true;
        gGame.markedCount++;
        elSpan.innerText = FLAG;
        elCell.classList.remove('covered');
        elCell.classList.add('revealed');
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
        elCell.classList.remove('revealed');
    }
    checkVictory();
}

function gameOver() {
    gGame.isLost = true;
    stopTimer();
    // reveal all mines
    var elMineCells = document.querySelectorAll('.mine');
    var elMineSpans = document.querySelectorAll('.mine span');
    for (var i = 0; i < elMineCells.length; i++) {
        elMineSpans[i].classList.remove('hidden');
        elMineSpans[i].classList.add('shown');
        elMineCells[i].classList.remove('covered');
        elMineCells[i].classList.add('revealed');
    }
    // update the smiley
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerText = '😵';
}

function checkVictory() {
    if (gGame.markedCount + gGame.shownCount === gLevel.SIZE ** 2) {
        gGame.isOn = false;
        stopTimer();
        // update local storage
        gGame.secsPassed = parseInt((gTimeStopped - gTimeBegan) / 1000);
        storeLocally();
        showLocalStorage();
        // update the smiley
        var elSmiley = document.querySelector('.smiley');
        elSmiley.innerText = '🥳';
    }
}

function restart() {
    // reset the variables
    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        lives: 3,
        hints: 3,
        safeClicks: 3,
        isLost: false,
        isManually: false,
        manualMines: 0
    }
    // reset timer
    gTimeBegan = null
    gTimeStopped = null
    gStoppedDuration = 0
    clearInterval(gTimerInterval);
    var timer = document.querySelector('.timer span');
    timer.innerText = '00:00';
    // update the features
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerText = '🙂';
    var elSafeButton = document.querySelector('.safe');
    elSafeButton.style.backgroundColor = 'rgb(89, 238, 59)';
    var elSafeClicksLeft = document.querySelector('.num-of-safe-clicks');
    elSafeClicksLeft.innerText = gGame.safeClicks;
    var elManualMinesText = document.querySelector('.manual-mines');
    elManualMinesText.style.display = 'none';
    init();
}

function safeClick() {
    if (gGame.safeClicks === 0) return;
    if (gGame.shownCount === 0) return;
    // get a random safe cell
    var safeCells = getSafeCells();
    var randIdx = getRandomInt(0, safeCells.length);
    var randSafeCell = safeCells[randIdx];
    // update safe clicks
    gGame.safeClicks--;
    var elSafeClicksLeft = document.querySelector('.num-of-safe-clicks');
    elSafeClicksLeft.innerText = gGame.safeClicks;
    var elSafeButton = document.querySelector('.safe');
    if (gGame.safeClicks === 0) elSafeButton.style.backgroundColor = 'rgb(148, 147, 147)';
    // reveal safe cell
    var elSafeCell = document.querySelector(`#cell-${randSafeCell.i}-${randSafeCell.j}`);
    elSafeCell.classList.remove('covered');
    elSafeCell.classList.add('safe-click');
    // remove safe click after 1.5 secs
    setTimeout(function () {
        elSafeCell.classList.add('covered');
        elSafeCell.classList.remove('safe-click');
    }, 1500);
}

function getSafeCells() {
    var safeCells = [];
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var currCell = gBoard[i][j];
            if (!currCell.isMine && !currCell.isShown) {
                var safeCell = { i: i, j: j }
                safeCells.push(safeCell);
            }
        }
    }
    return safeCells;
}

function storeLocally() {
    // determin the level
    if (gLevel.SIZE === 4) var storageSection = 'beginner';
    else if (gLevel.SIZE === 8) storageSection = 'medium';
    else storageSection = 'expert';
    // store in local storage
    if (localStorage.getItem('best time ' + storageSection) === null) {
        localStorage.setItem('best time ' + storageSection, gGame.secsPassed);
    }
    if (gGame.secsPassed < localStorage.getItem('best time ' + storageSection)) {
        localStorage.setItem('best time ' + storageSection, gGame.secsPassed);
    }
}

function showLocalStorage() {
    // determine the level
    if (gLevel.SIZE === 4) var storageSection = 'beginner';
    else if (gLevel.SIZE === 8) storageSection = 'medium';
    else storageSection = 'expert';
    // get the value from the local storage and display it in time format
    var bestTimeSec = localStorage.getItem('best time ' + storageSection) % 60;
    var bestTimeMin = Math.floor((localStorage.getItem('best time ' + storageSection)) / 60);
    var bestTimeSecStr = (bestTimeSec < 10) ? '0' + bestTimeSec : bestTimeSec;
    var bestTimeMinStr = (bestTimeMin < 10) ? '0' + bestTimeMin : bestTimeMin;
    if (bestTimeSec === null) var bestTimeStr = '00:00';
    else if (bestTimeSec < 60 && bestTimeMin === 0) bestTimeStr = '00:' + bestTimeSecStr;
    else bestTimeStr = bestTimeMinStr + ':' + bestTimeSecStr;
    // render the best time
    var elBestTime = document.querySelector('.best-time span');
    elBestTime.innerText = bestTimeStr;
}

function getHint() {
    if (gGame.hints === 0) return;
    if (gGame.shownCount === 0) return;
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
        gGame.isOn = true;
    }, 1000);
}

function getNegsIncl(posI, posJ) {
    var negs = [];
    for (var i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = posJ - 1; j <= posJ + 1; j++) {
            if (j < 0 || j >= gBoard.length) continue;
            if (gBoard[i][j].isShown) continue;
            var neg = { i: i, j: j };
            negs.push(neg);
        }
    }
    return negs;
}

function manualMode() {
    init();
    gGame.isManually = true;
    // show how many mines can be placed
    var elManualMinesText = document.querySelector('.manual-mines');
    elManualMinesText.style.display = 'block';
    var numOfMinesToPlace = gLevel.MINES;
    var elNumOfMinesToPlace = document.querySelector('.manual-mines span');
    elNumOfMinesToPlace.innerText = numOfMinesToPlace;
}

function putMineManually(i, j) {
    if (gBoard[i][j].isMine) return
    gBoard[i][j].isMine = true;
    var elCell = document.querySelector(`#cell-${i}-${j}`);
    elCell.innerText = MINE;
    // show the placed mines for 1 sec
    setTimeout(function () {
        elCell.innerText = '';
        renderBoard(gBoard);
    }, 1000);
    gGame.manualMines++;
    // update the decreasing number of mines to place
    var numOfMinesToPlace = gLevel.MINES - gGame.manualMines;
    var elNumOfMinesToPlace = document.querySelector('.manual-mines span');
    elNumOfMinesToPlace.innerText = numOfMinesToPlace;
    // when all mines are placed, the mine-counter disappears
    if (numOfMinesToPlace === 0) {
        setTimeout(function () {
            var elManualMinesText = document.querySelector('.manual-mines');
            elManualMinesText.style.display = 'none';
        }, 1000);
    }
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
    var timer = document.querySelector('.timer span');
    timer.innerText =
        (min > 9 ? min : '0' + min) + ':' +
        (sec > 9 ? sec : '0' + sec);
}