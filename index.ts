// @ts-nocheck
import * as SnooWrap from "snoowrap"
import * as SnooStorm from "snoostorm"
import * as dotenv from "dotenv"
import * as admin from "firebase-admin"
import * as tickers from "@swingtrackr/stock-exchange-symbols"
import * as serviceAccount from "./wsb-moon-firebase-adminsdk-707s1-5c5ef1fcdc.json"
dotenv.config()

//Setup Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

//Regex matching for "moon or 🚀"
const pattern_moon:RegExp = new RegExp("(🚀|moon)", "i")

//Prepare array of symbols 
let symbols:String[] = tickers.symbols.map((symbol) => {
  return symbol.symbol
}).filter((symbol) => {
  if(symbol == "DD") return false
  if(symbol == "III") return false
  if(symbol == "A") return false
  if(symbol == "PT") return false
  if(symbol == "ARE") return false
  if(symbol == "OR") return false
  return true
})

//Initiate Comment Stream
const client = new SnooStorm.CommentStream(
  new SnooWrap({
    userAgent: 'reddit-bot-example-node',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
  }),
  {
    subreddit: "wallstreetbets"
  }
)
console.log("Started Streaming comments!")

client.on("item", comment => {
  const body = comment.body
  if(pattern_moon.test(body.toLowerCase())) {
    const aggregate = body + " " + comment.link_title
    for(let symbol of symbols) {
      const index = aggregate.search("\\b"+symbol+"\\b")
      if(index != -1) {
        storeData(symbol, comment.created_utc)
      }
    }
  }
})

async function storeData(symbol:String, timeStamp:Number) {
  const res = await db.collection('rockets').add({
    symbol: symbol,
    time: timeStamp
  });
  
  console.log(symbol + " is going to the moon. Timestamp: "+timeStamp);
}
