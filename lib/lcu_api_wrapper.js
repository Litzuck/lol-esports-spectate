const WebSocket = require('ws')
const LCUConnector = require('lcu-connector')
const { EventEmitter } = require('events')
const requestPromise = require('request-promise')

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0

class LCUApiWrapper extends EventEmitter {
    constructor() {
        super()

        this.callbacks = new Map()
        this.__connector = new LCUConnector();
        this.__connector.on('connect', (data) => {
            console.log(data);
            this.__data = data
            var authkey = Buffer.from(`riot:${data.password}`).toString('base64')
            this.__authkey = authkey
            this.__user = "riot"
            this.__password = data.password
            this.__port = data.port
            this.__ws = new WebSocket(`wss://riot:${data.password}@127.0.0.1:${data.port}/`, "wamp", {
                origin: `https://127.0.0.1:${data.port}`,
                Host: `127.0.0.1:${data.port}`,
                Authorization: `Basic ${authkey}`
                //auth: `riot:${data.password}`
            });

            this.__ws.on('unexpected-response', (msg) => {
                console.log(msg)
            })
            this.__ws.on('error', (err) => {
                console.log(err)
            })
            this.__ws.on('message', (msg) => {
                var data = JSON.parse(msg)
                console.log(data)
                var callback = this.callbacks.get(data[1])
                if (callback != null)
                    callback(data[2])
                // if (/\/lol-champ-select\/.*/.test()) {
                //     console.log("Ch")
                // }
                // console.log(JSON.parse(msg))

            });
            this.__ws.on('open', () => {
                console.log("open")
                //this.__ws.send('[5, "OnJsonApiEvent"]');
                //this.__ws.send('[5, "OnJsonApiEvent_lol-champ-select_v1_session"]')
                for (var key of this.callbacks.keys()) {
                    console.log(key + " subscribed to")
                    this.__ws.send(`[5, "${key}"]`)
                }
            });

        });

    }

    start() {
        this.__connector.start()
    }


    subscribe(event, callback) {

        if (this.__ws != null && this.__ws.readyState == 1) {
            this.__ws.send(`[5, "${event}"]`)
            this.callbacks.set(event, callback)
        }
        else {
            this.callbacks.set(event, callback)
        }
    }

    // request2(uri, callback) {
    //     // var xmlHttp = new XMLHttpRequest();
    //     // xmlHttp.onreadystatechange = function () {
    //     //     if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
    //     //         callback(xmlHttp.responseText);
    //     // }
    //     // xmlHttp.open("GET", `https://127.0.0.1:${this.__data.port}` + uri, true); // true for asynchronous 
    //     // xmlHttp.send(null);
    //     axios({
    //         method: 'get',
    //         url: `https://127.0.0.1:${this.__data.port}` + uri,
    //         responseType: 'stream',
    //         httpsAgent: new https.Agent({
    //             rejectUnauthorized: false
    //         }),
    //         headers: { 'Authorization': `Basic ${this.__authkey}` },
    //     }).then((response => callback(response)))

    // }

    // request(uri, callback) {
    //     this.__ws.send("GET " + uri + " HTTP/1.1")
    // }

    request(uri, callback) {
        requestPromise({
            strictSSL: false,
            url: `https://${this.__user}:${this.__password}@127.0.0.1:${this.__port}/${uri}`,

        })
            .then((response) => callback(response))
            .catch((err) => { console.log(err) });

    }
}

// function testChampSelect(data) {
//     console.log(data)
// }
// lcu = new LCUApiWrapper()
// lcu.start()
// lcu.subscribe("OnJsonApiEvent_lol-champ-select_v1_session", testChampSelect)

module.exports = LCUApiWrapper