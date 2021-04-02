import WebSocket from "ws";
import LCUConnector from "lcu-connector";
import { EventEmitter} from "events";
import requestPromise from "request-promise";
import {LCUApiInterface} from "./LCUApiInterface"

export class LCUApiWrapper extends EventEmitter implements LCUApiInterface{
    callbacks: Map<string,(data:any) => void>;
    connector: LCUConnector;
    user: string;
    authkey: string;
    password: string;
    port: number;
    ws: WebSocket;

    constructor() {
        super()

        this.callbacks = new Map();
        this.connector = new LCUConnector();
        this.connector.on('connect', (data) => {
            console.log(data);
            var authkey = Buffer.from(`riot:${data.password}`).toString('base64')
            this.authkey = authkey
            this.user = "riot"
            this.password = data.password
            this.port = data.port
            this.ws = new WebSocket(`wss://riot:${data.password}@127.0.0.1:${data.port}/`, "wamp", {
                origin: `https://127.0.0.1:${data.port}`,
                Host: `127.0.0.1:${data.port}`,
                Authorization: `Basic ${authkey}`
                //auth: `riot:${data.password}`
            });

            this.ws.on('unexpected-response', (msg:string) => {
                console.log(msg)
            })
            this.ws.on('error', (err:string) => {
                console.log(err)
            })
            this.ws.on('message', (msg:string) => {
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
            this.ws.on('open', () => {
                console.log("open")
                //this.__ws.send('[5, "OnJsonApiEvent"]');
                //this.__ws.send('[5, "OnJsonApiEvent_lol-champ-select_v1_session"]')
                this.callbacks.forEach( (value:any, key:string) => {
                    console.log(key + " subscribed to");
                    this.ws.send(`[5, "${key}"]`);
                })
                // for (var key of this.callbacks.keys()) {
                //     console.log(key + " subscribed to")
                //     this.ws.send(`[5, "${key}"]`)
                // }
            });

        });

    }

    start() {
        this.connector.start()
    }


    subscribe(event:string, callback: (data: any) => void) {
        if (this.ws != null && this.ws.readyState == 1) {
            this.ws.send(`[5, "${event}"]`);
        }
        this.callbacks.set(event, callback);
    }


    request(uri:string, callback:(data:any)=> void) {
        requestPromise({
            strictSSL: false,
            url: `https://${this.user}:${this.password}@127.0.0.1:${this.port}/${uri}`,

        })
            .then((response) => callback(response))
            .catch((err) => { console.log(err) });

    }
}