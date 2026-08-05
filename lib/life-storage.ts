import type { LifeHubData } from "./life-types";
const KEY="abrar-os-life-hub-v1";
export const emptyLifeHub:LifeHubData={contacts:[],followUps:[],shopping:[],stock:[],notes:[]};
export function loadLifeHub():LifeHubData{if(typeof window==="undefined")return emptyLifeHub;try{return {...emptyLifeHub,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return emptyLifeHub}}
export function saveLifeHub(data:LifeHubData){if(typeof window!=="undefined")localStorage.setItem(KEY,JSON.stringify(data))}
export function lifeId(){return typeof crypto!=="undefined"&&"randomUUID" in crypto?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`}
