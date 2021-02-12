const fs = require('fs');
const { EventEmitter } = require('events')


class ChampionSelectReplay extends EventEmitter{


    constructor(replay_file){
        super()
        try {
            var data = fs.readFileSync(replay_file)
            this.replay = JSON.parse(data)
          } catch (err) {
            console.error(err)
          }
        this.callbacks = new Map()
    }



    start(){
        var dataJSONs = this.replay.jsons;
        var callback = this.callbacks.get("OnJsonApiEvent_lol-champ-select_v1_session")

        dataJSONs.forEach(replayEvent => {
            var timeOffset = replayEvent.time;
            var data = replayEvent.data;
            
            // setTimeout((callback,data),timeOffset);
            setTimeout(() => {
                callback(data)
            }, timeOffset);
        });
    }

    subscribe(event, callback){
        this.callbacks.set(event, callback)
    }
}

module.exports = ChampionSelectReplay;