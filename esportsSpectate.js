const { remote } = require('electron')
const { Menu, MenuItem } = remote
const api = new ChampSelectApi()
// var a = new LCUApiWrapper()
api.start()
var timerLeft = 0
var timerRight = 0

var menu = Menu.getApplicationMenu()
menu.append(new MenuItem({ label: 'Fetch Summoner Names', click() { getNames() } }))
menu.append(new MenuItem({ label: 'Set Summoner Names', click() { console.log("not implemented yet") } }))

Menu.setApplicationMenu(menu)
api.on('championSelectStarted', (data) => {
    console.log("spec started")
    timerLeft = document.getElementById("timerLeft")
    timerRight = document.getElementById("timerRight")
    gameStarted = true
})

api.on('championHoverChanged', (championId, actorCellId) => {
    var summoner = document.getElementById("summoner" + actorCellId)
    summoner.classList.remove("no-champion")
    summoner.classList.add("is-picking-now");
    summoner.classList.add("champion-not-locked");
    var background = document.querySelector("#summoner" + actorCellId + " .background");
    background.setAttribute("data-id", championId);
    background.setAttribute("style", "background-image:url(images/splash-art/centered/" + championId + ".jpg)");
})

api.on('championChanged', (championId, actorCellId) => {
    var summoner = document.getElementById("summoner" + actorCellId)
    // summoner.classList.remove("no-champion")
    // summoner.classList.add("is-picking-now");
    // summoner.classList.add("champion-not-locked");
    var background = document.querySelector("#summoner" + actorCellId + " .background");
    background.setAttribute("data-id", championId);
    background.setAttribute("style", "background-image:url(images/splash-art/centered/" + championId + ".jpg)");
})

api.on('championLocked', (championId, actorCellId) => {
    var summoner = document.getElementById("summoner" + actorCellId);
    summoner.classList.remove("is-picking-now");
    summoner.classList.remove("champion-not-locked");
    summoner.classList.add("champion-locked")
})


api.on('championBanned', (championId, banTurn) => {
    var ban_wrapper = document.getElementById("ban" + banTurn);
    ban_wrapper.classList.add("completed");
    ban_wrapper.classList.remove("active")
    var ban_icon = document.querySelector("#ban" + banTurn + " .ban")
    if (championId != 0) {
        ban_icon.setAttribute("style", "background-image:url(images/splash-art/centered/" + championId + ".jpg)")
        ban_icon.setAttribute("data-id", championId)
    }
})


api.on('phaseChanged', (newType) => {

    console.log("phase changed to:" + newType)
    var main = document.getElementsByClassName("champ-select-spectate-component")[0]
    // main.classList.remove("left-side-acting")
    // main.classList.add("right-side-acting")
    // main.classList.remove("show-both-timers")

    curPhase++
    var phase = document.getElementsByClassName("phase")[0]
    phase.innerHTML = phases[curPhase]
    if (curPhase == 4) {
        main.classList.remove("left-side-acting")
        main.classList.remove("right-side-acting")
        main.classList.add("show-both-timers")
    }
})

api.on('playerTurnBegin', (actorCellId) => {
    var summoner = document.getElementById("summoner" + actorCellId);
    summoner.classList.add("is-picking-now");
})

api.on('banTurnBegin', (banTurn) => {
    var ban_wrapper = document.getElementById("ban" + banTurn);
    ban_wrapper.classList.add("active");
})

api.on('playerTurnEnd', (actorCellId) => {
    //TODO add fancy animations or smt
    //reset Timer
})

api.on('banTurnEnd', (banTurn) => {
    //TODO dont know Todo macht das
    //resetTimer
})

api.on('newTurnBegin', (timeLeftInSec) => {
    console.log("reset timer")
    t = timeLeftInSec
})

api.on('teamTurnChanged', (isAllyAction) => {
    var main = document.getElementsByClassName("champ-select-spectate-component")[0]
    if (isAllyAction) {
        main.classList.add("left-side-acting")
        main.classList.remove("right-side-acting")
    }
    else {
        main.classList.remove("left-side-acting")
        main.classList.add("right-side-acting")
    }
})

api.on('summonerSpellChanged', (actorCellId, spellIndex, spellId) => {
    var summonerSpell = document.querySelector("#summoner" + actorCellId + " .spell:nth-child(" + spellIndex + ")")
    summonerSpell.setAttribute("src", "images/summoner-spells/" + spellId + ".png")
})

function resetTimer(time, type, actorId, pickTurn) {
    var main = document.getElementsByClassName("champ-select-spectate-component")[0]
    main.classList.remove("left-side-acting")
    main.classList.add("right-side-acting")
    main.classList.remove("show-both-timers")
}

var curPhase = 0
var phases = ['Ban Phase 1', 'Picking Phase 1', 'Ban Phase 2', 'Picking Phase 2', '']
var gameStarted = false
var t = 29
var x = setInterval(function () {
    if (t != 0 && gameStarted) {
        t -= 1
        if (t < 10) {
            timerLeft.innerHTML = ":0" + t
            timerRight.innerHTML = ":0" + t
        } else {
            timerLeft.innerHTML = ":" + t
            timerRight.innerHTML = ":" + t
        }
    }
}, 1000)


function changeSummonerSpell(actorCellId, spellIndex, spellId) {
    var summonerSpell = document.querySelector("#" + actorCellId + " .spell:nth-child(" + spellIndex + ")")
    summonerSpell.setAttribute("src", "images/summoner-spells/" + spellId + ".png")
}


function getNames() {
    api.request("lol-lobby/v2/lobby", a)
}

function a(response) {
    var b = JSON.parse(response)
    console.log(b)
    var blueTeam = b.gameConfig.customTeam100
    var redTeam = b.gameConfig.customTeam200
    var i;
    for (i = 0; i < blueTeam.length; i++) {
        var id = i * 2
        var name = document.querySelector("#summoner" + id + " .summoner-name")
        name.innerHTML = blueTeam[i].summonerName
    }
    for (i = 0; i < redTeam.length; i++) {
        var id = (i * 2) + 1
        var name = document.querySelector("#summoner" + id + " .summoner-name")
        name.innerHTML = redTeam[i].summonerName
    }
}


function testRun() {
    api.emit("championSelectStarted", 0)

    setTimeout(testBans1, 200)
    setTimeout(testChamps, 7000)
    setTimeout(testBans2, 16000)
    setTimeout(testChamps2, 27000)
    setTimeout(testend, 30000)
}

function testBans1() {
    api.emit("championBanned", 266, 1)
    api.emit('teamTurnChanged', false)

    setTimeout(function () {
        api.emit("championBanned", 266, 2);
        api.emit('teamTurnChanged', true)
        api.emit('newTurnBegin', 60)
    }, 1000)

    setTimeout(function () {
        api.emit("championBanned", 266, 3)
        api.emit('teamTurnChanged', false)
        api.emit('newTurnBegin', 60)
    }, 2000)

    setTimeout(function () {
        api.emit("championBanned", 266, 4)
        api.emit('teamTurnChanged', true)
        api.emit('newTurnBegin', 60)
    }, 3000)

    setTimeout(function () {
        api.emit("championBanned", 266, 5)
        api.emit('teamTurnChanged', false)
        api.emit('newTurnBegin', 60)
    }, 4000)

    setTimeout(function () {
        api.emit("championBanned", 266, 6)
        api.emit('teamTurnChanged', true)
        api.emit('newTurnBegin', 60)
    }, 5000)

    setTimeout(function () {
        api.emit("phaseChanged", "pick")
    }, 5500)
}

function testBans2() {

    setTimeout(function () {
        api.emit("championBanned", 266, 8)
        api.emit('teamTurnChanged', true)
        api.emit('newTurnBegin', 60)
    }, 1000)
    setTimeout(function () {
        api.emit("championBanned", 266, 7)
        api.emit('teamTurnChanged', false)
        api.emit('newTurnBegin', 60)
    }, 2000)
    setTimeout(function () {
        api.emit("championBanned", 266, 10)
        api.emit('teamTurnChanged', true)
        api.emit('newTurnBegin', 60)
    }, 3000)
    setTimeout(function () {
        api.emit("championBanned", 266, 9)
        api.emit('teamTurnChanged', false)
        api.emit('newTurnBegin', 60)
    }, 4000)

    setTimeout(function () {
        api.emit("phaseChanged", "pick")
    }, 4500)
}

function testChamps() {

    setTimeout(function () {
        api.emit("championHoverChanged", 266, 0)
        api.emit("championLocked", 266, 0)
        api.emit('teamTurnChanged', false)
        api.emit('newTurnBegin', 60)
    }, 1000)

    setTimeout(function () {
        api.emit("championHoverChanged", 266, 1)
        api.emit("championLocked", 266, 1)
        api.emit('newTurnBegin', 60)
        // api.emit('teamTurnChanged', false)
    }, 2000)

    setTimeout(function () {
        api.emit("championHoverChanged", 266, 3)
        api.emit("championLocked", 266, 3)
        api.emit('teamTurnChanged', true)
        api.emit('newTurnBegin', 60)
    }, 3000)

    setTimeout(function () {
        api.emit("championHoverChanged", 266, 2)
        api.emit("championLocked", 266, 2)
        // api.emit('teamTurnChanged', false)
    }, 4000)

    setTimeout(function () {
        api.emit("championHoverChanged", 266, 4)
        api.emit("championLocked", 266, 4)
        api.emit('teamTurnChanged', false)
    }, 5000)

    setTimeout(function () {
        api.emit("championHoverChanged", 266, 5)
        api.emit("championLocked", 266, 5)
        api.emit("phaseChanged", "ban")
    }, 6000)

    // api.emit("championHoverChanged", 266, 1)
    // api.emit("championLocked", 266, 1)
    // api.emit("championHoverChanged", 266, 3)
    // api.emit("championLocked", 266, 3)
    // api.emit("championHoverChanged", 266, 2)
    // api.emit("championLocked", 266, 2)
    // api.emit("championHoverChanged", 266, 4)
    // api.emit("championLocked", 266, 4)
    // api.emit("championHoverChanged", 266, 5)
    // api.emit("championLocked", 266, 5)
}

function testChamps2() {

    setTimeout(function () {
        api.emit("championHoverChanged", 266, 7)
        api.emit("championLocked", 266, 7)
        api.emit('teamTurnChanged', true)
    }, 1000)

    setTimeout(function () {
        api.emit("championHoverChanged", 266, 6)
        api.emit("championLocked", 266, 6)
        // api.emit('teamTurnChanged', false)
    }, 2000)

    setTimeout(function () {
        api.emit("championHoverChanged", 266, 8)
        api.emit("championLocked", 266, 8)
        api.emit('teamTurnChanged', false)
    }, 3000)

    setTimeout(function () {
        api.emit("championHoverChanged", 266, 9)
        api.emit("championLocked", 266, 9)
        // api.emit('teamTurnChanged', false)
        api.emit("phaseChanged", "")
    }, 4000)

    //     api.emit("championHoverChanged", 266, 7)
    //     api.emit("championLocked", 266, 7)
    //     api.emit("championHoverChanged", 266, 6)
    //     api.emit("championLocked", 266, 6)
    //     api.emit("championHoverChanged", 266, 8)
    //     api.emit("championLocked", 266, 8)
    //     api.emit("championHoverChanged", 266, 9)
    //     api.emit("championLocked", 266, 9)
}


function testend() {
    api.emit("championChanged", 17, 0)
    api.emit("championChanged", 32, 2)
}