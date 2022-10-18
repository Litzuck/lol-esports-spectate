import WebSocket from "ws";
import LCUConnector from "lcu-connector";
import { EventEmitter} from "events";
import requestPromise from "request-promise";
import {LCUApiInterface} from "./LCUApiInterface"
import ReconnectingWebSocket from "./internal/ReconnectingWebSocket"

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

export class LCUApiWrapper extends EventEmitter implements LCUApiInterface{

    static instance: LCUApiWrapper;
    callbacks: Map<string,(data:any) => void>;
    connector: LCUConnector;
    user: string;
    authkey: string;
    password: string;
    port: number;
    ws: WebSocket;
    connected: boolean = false;

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
            this.ws = new ReconnectingWebSocket(`wss://riot:${data.password}@127.0.0.1:${data.port}/`, "wamp", {
                origin: `https://127.0.0.1:${data.port}`,
                Host: `127.0.0.1:${data.port}`,
                Authorization: `Basic ${authkey}`
                //auth: `riot:${data.password}`
            });

            this.ws.on('unexpected-response', (msg:string) => {
                console.log("unexpected message",msg)
            })
            this.ws.on('error', (err:string) => {
                console.log("error",err)
            })
            this.ws.on('message', (msg:string) => {
                var data = JSON.parse(msg)
                // console.log(data)
                var callback = this.callbacks.get(data[1])
                if (callback != null)
                    callback(data[2])

            });
            this.ws.on('open', () => {
                this.callbacks.forEach( (value:any, key:string) => {
                    console.log(key + " subscribed to");
                    this.ws.send(`[5, "${key}"]`);
                });
                this.connected = true;
            });

            this.ws.on('close', () => {
                this.connected = false;
            });

            this.ws.connect();

        });

        this.connector.on("disconnect", ()=>{
            this.ws.close()
        })

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


    request(uri:string, callback:(data:any)=> void, errorCallback?:(error:Error)=>any) {
        requestPromise({
            strictSSL: false,
            url: `https://${this.user}:${this.password}@127.0.0.1:${this.port}/${uri}`,

        })
            .then((response) => callback(response))
            .catch(errorCallback)
            //.catch((err) => { console.log("Error in REST API Request.", err); });

    }

    static getInstance(){
        if(!LCUApiWrapper.instance)
            LCUApiWrapper.instance = new LCUApiWrapper()
        return LCUApiWrapper.instance;
    }

    getConnectedStatus():boolean {
        return this.connected;
    }
}