import { app } from "./app.js";
import dotenv from "dotenv"
import connectDB from './db/index.js';
dotenv.config({
    path: "./env"
})

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("Database Can't connect:", error);
        }
        )
    app.listen(process.env.PORT || 8000, ()=>{console.log('And All Set...👍')})
}
)
    .catch((error) => {
    console.log("Mongo DB Connection Failed:" , error);
    
}
)
// const app = express()

// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
//         app.on("error", (error) => {
//             console.log("Error:", error);
//             throw error;            
//         }
//         )
//         app.listen(process.env.PORT, () => { console.log('And All Set...👍') })
        
//     } catch (error) {
//         console.error("Error:", error);
        
//     }
// }
// )()