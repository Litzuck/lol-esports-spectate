# lol-esports-spectate
JS Api for creating a custom view for a tournament draft spectator with a example like the official one used in the competetive scene.


## Example Application

~~For an example application using this module to create something like the official esports spectator go [here](./example/README.md)~~
The example client has been moved to a standalone repository, which can be found [here](https://github.com/Litzuck/lol-spectator-overlay-client)
## Download
LolEsportsSpectate is installable via:

- [GitHub](https://github.com/Litzuck/LoLEsportsSpectate) `git clone https://github.com/Litzuck/LoLEsportsSpectate.git`
- [npm](https://www.npmjs.com/): `npm install lol-esports-spectate`

## Usage example

```js
const ChampSelectApi = require('lol-esports-spectate');
const api = new ChampSelectApi();
//start listening for events
api.start()

api.on('championSelectStarted', (data) => {
    console.log("champion select started")
    gameStarted = true
})


```

## Available methods

### constructor ()

Creates a new ChampSelectApi.

**Parameters**

1. **[executablePath] {string}** A path to where the LeagueClient executable resides. If not passed it will be automatically figured out from the OS process list.

### start()

Starts listening for events of from the LCU.

### request(uri, callback)

Sends a request to the specified enpoint of the LCU and calls the given function with the result.

## Events

### championSelectStarted

Fired when the champion select started

### newTurnBegin(timeLeftinPhase)

Fired when its a new players turn

### banTurnBegin(playerTurn)

Fired when it a new players turn to ban a champion

### playerTurnBegin(playerId)

Fired when it a new players turn to pick a champion

### championHoverChanged(championId, playerId)

Fired when a player changed his hovered champion

### championBanned(championId, playerTurn)

Fired when it a new players turn to ban a champion

### championLocked(championId, playerId)

Fired when a champion is locked in.

### phaseChanged(type)

Fired when the phase of the champion select changed

### teamTurnChanged(isBlueTurn)

Fired when the team who's turn it is changed

### summonerSpellChanged(playerId, slotId,summonerSpellId)

Fired when a player changed one of this summoner spells


