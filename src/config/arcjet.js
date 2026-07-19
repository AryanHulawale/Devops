import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";
import { interval } from "drizzle-orm/pg-core";


const aj = arcjet({

    key: process.env.ARCJET_KEY,
    rules: [

        shield({ mode: "LIVE" }),

        detectBot({
            mode: "LIVE",
            allow: [
                "CATEGORY:SEARCH_ENGINE",
                "CATEGORY:PREVIEW"
            ],
        }),

        slidingWindow({
            mode: "LIVE",
            interval: "2s",
            max: 5
        }),

    ],
});

export default aj