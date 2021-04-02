
export interface LCUApiInterface {

    start():void;

    subscribe(event: string, callback:(data:any)=>void):void;
    
    request(uri:string, ccallback:(data:any)=>void):void;
}