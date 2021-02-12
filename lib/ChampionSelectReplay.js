const fs = require('fs');
const { EventEmitter } = require('ws');


class ChampionSelectReplay extends EventEmitter{


    constructor(replay_file){
        super()
        this.replay = JSON.parse(fs.readFile(replay_file));
        this.callbacks = new Map()
    }



    start(){
        var dataJSONs = this.replay.jsons;
        var callback = this.callbacks.get("OnJsonApiEvent_lol-champ-select_v1_session")

        dataJSONs.forEach(replayEvent => {
            var timeOffset = replayEvent.time;
            var data = replayEvent.data;
            
            setTimeout((callback,data),timeOffset);
        });
    }

    subscribe(event, callback){
        this.callbacks.set(event, callback)
    }
}