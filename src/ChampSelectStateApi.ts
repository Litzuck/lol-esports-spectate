import { LCUApiWrapper } from "./LCUApiWrapper"
import * as path from "path";
import { ChampionSelectReplay } from "./ChampSelectReplay"
import { State, Pick, Ban } from "./Interfaces"
import { EventData, Member } from "./internal/ExternalInterfaces"
import { LCUApiInterface } from "./LCUApiInterface";
import { TypedEmitter } from 'tiny-typed-emitter';
import fs from 'fs'

export declare interface ChampSelectApi{
    on(event:"championSelectEnd"):void;
    on(event:"championSelectStarted"):void;
    on(event:"newState", state:State):void;
    on(event:"newPickOrder", pickOrderState:State): void;
    on(event:string)
}

interface ChampSelectStateApiEvents {
    'championSelectEnd': () => void;
    'championSelectStarted': ()=> void;
    'newState': (state:State)=> void;
    'newPickOrder': (pickOrder:State)=> void;
}

export class ChampSelectStateApi extends TypedEmitter<ChampSelectStateApiEvents> {

    summonerNameMap: Map<number, string|any>;
    pickOrderState:State = null;
    replay:boolean;
    jsonData: { jsons:[{ time:number, data:EventData}?], summonerNameMap?: any};
    start: number = 0;

    constructor(replay?: boolean, replay_file?: string) {
        super()

        this.summonerNameMap = new Map();
        this.replay = replay;
        var leagueApi: LCUApiInterface;
        if (replay) {
            let replayBuf = fs.readFileSync(replay_file);
            let replayJson = JSON.parse(replayBuf.toString());
            if(replayJson.summonerNameMap)
                this.summonerNameMap = new Map(Object.entries(replayJson.summonerNameMap).map(entry => {return [parseInt(entry[0]), entry[1]];}))
            leagueApi = new ChampionSelectReplay(replay_file = replay_file)
        }
        else {
            leagueApi = new LCUApiWrapper();
        }

        leagueApi.subscribe("OnJsonApiEvent_lol-champ-select_v1_session", this.champSelectEventCallback.bind(this))


        leagueApi.start()

        var blueSummonerNames = []
        var redSummonerNames = []

        if(leagueApi instanceof LCUApiWrapper){

            var getSummonersRequestInt = setInterval(() => {
                leagueApi.request("lol-lobby/v2/lobby/members", (data: string) => {

                    let members = JSON.parse(data)
                    Array.prototype.forEach.call(members ,(member, idx) => {
                        // console.log(member)
                        if (!this.summonerNameMap.has(member.summonerId))
                            this.summonerNameMap.set(member.summonerId, member.summonerName)
                    });
                });
            }, 5000);

        }
    }


    champSelectEventCallback(eventData: EventData): void {
        if (eventData.eventType === "Delete") {
            //End of champion select
            this.emit("championSelectEnd");
        }
        else if(eventData.eventType === "Create"){
            this.emit("championSelectStarted")
            this.pickOrderState=null
            this.jsonData = { jsons:[]}
            this.start = Date.now();
        }
        else {
            
            let state = this.parseData(eventData)
            this.emit("newState", state)

            if(this.pickOrderState===null && eventData.data.timer.phase==="FINALIZATION"){
                this.pickOrderState = state;
                // console.log(eventData)
                this.emit("newPickOrder", this.pickOrderState)
                
            }
        }
        this.jsonData.jsons.push({time: Date.now()-this.start, data:eventData})

        if (!this.replay && eventData.eventType === "Delete") {
            this.jsonData.summonerNameMap = Object.fromEntries(this.summonerNameMap)
            let now = Date.now();
            var fs = require('fs');
            var log_file = path.join('./','logs', 'replay_' + now + '.json')
            fs.writeFile(log_file, JSON.stringify(this.jsonData), 'utf8', (err) => {
                if (err) throw err;
                console.log('The replay file has been saved!');
            });
        }

    }


    autoConvertMapToObject = (map) => {
        const obj = {};
        for (const item of [...map]) {
          const [
            key,
            value
          ] = item;
          obj[key] = value;
        }
        return obj;
      }

    lastState: State;
    

    parseData(eventData: EventData) {

        if (eventData.eventType === "Delete")
            return this.lastState;
        let data = eventData.data

        // console.log(data)
        var state: State = {
            started: true,
            bluePicks: [],
            redPicks: [],
            blueBans: [],
            redBans: [],
            time: 60,
            actingSide: "none",
            timestamp: 0,
            phase: "",
        }

        var blueBanCounter = 0
        var redBanCounter = 0
        var bluePickCounter = 0
        var redPickCounter = 0
        var currentActionIsAlly = false



        let myTeam = data.myTeam
        for (let i = 0; i < data.myTeam.length; i++) {
            let pick: Pick = { championId: myTeam[i].championId, isCompleted: false, isPicking: false, spellId1: myTeam[i].spell1Id, spellId2: myTeam[i].spell2Id, summonerName: this.summonerNameMap.get(myTeam[i].summonerId) }
            state.bluePicks[i] = pick
        }


        let theirTeam = data.theirTeam
        for (let i = 0; i < data.theirTeam.length; i++) {
            let pick: Pick = { championId: theirTeam[i].championId, isCompleted: false, isPicking: false, spellId1: theirTeam[i].spell1Id, spellId2: theirTeam[i].spell2Id ,summonerName: this.summonerNameMap.get(theirTeam[i].summonerId)}
            state.redPicks[i] = pick
        }

        for (let i = 0; i < data.bans.numBans / 2; i++) {
            let banBlue: Ban = { championId: 0, isActive: false, isCompleted: false }
            let banRed: Ban = { championId: 0, isActive: false, isCompleted: false }
            state.blueBans[i] = banBlue
            state.redBans[i] = banRed
        }

        data.actions.forEach(action => {
            var actionData = action[0];
            if (actionData.type === "ban") {
                let ban: Ban = { championId: actionData.championId, isCompleted: actionData.completed, isActive: actionData.isInProgress }
                if (actionData.isAllyAction) {
                    state.blueBans[blueBanCounter].championId = actionData.championId;
                    state.blueBans[blueBanCounter].isActive = actionData.isInProgress;
                    state.blueBans[blueBanCounter].isCompleted = actionData.completed;
                    blueBanCounter++;
                }
                else {
                    state.redBans[redBanCounter].championId = actionData.championId;
                    state.redBans[redBanCounter].isActive = actionData.isInProgress;
                    state.redBans[redBanCounter].isCompleted = actionData.completed;
                    redBanCounter++;
                }
            }

            else if (actionData.type === "pick") {
                if (actionData.isAllyAction) {
                    state.bluePicks[bluePickCounter].isCompleted = actionData.completed;
                    state.bluePicks[bluePickCounter].isPicking = actionData.isInProgress;
                    bluePickCounter++;
                }
                else {
                    state.redPicks[redPickCounter].isCompleted = actionData.completed;
                    state.redPicks[redPickCounter].isPicking = actionData.isInProgress;
                    redPickCounter++;
                }
            }

            if (actionData.isInProgress)
                currentActionIsAlly = actionData.isAllyAction
        });

        if (data.timer.phase === "BAN_PICK") {
            if (data.actions[data.actions.length - 1][0].type === "ban") { //BAN PHASE
                state.phase = "Ban Phase"
            }
            else { //PICK PHASE
                state.phase = "Pick Phase"
            }
        }
        else {
            state.phase = ""
        }
        state.time = Math.trunc(data.timer.adjustedTimeLeftInPhase / 1000)

        if (data.timer.phase === "BAN_PICK") {
            if (currentActionIsAlly)
                state.actingSide = "blue"
            else
                state.actingSide = "red"
        }
        else {
            state.actingSide = "none"
        }

        state.timestamp = data.timer.internalNowInEpochMs


        this.lastState = state
        return state

    }

}

