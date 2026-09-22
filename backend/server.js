require("dotenv").config();
const OpenAI = require("openai");

// We point the OpenAI SDK to Groq's servers instead of OpenAI's
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1" 
});

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");


const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173"
    }
});

const rooms = {};

io.on("connection", (socket) => {

    console.log("Client Connected:", socket.id);


    socket.on("disconnect", () => {
        for (const roomId in rooms) {
            if (rooms[roomId].owner === socket.id) {
                delete rooms[roomId];
                console.log("Room deleted:", roomId);
            }
        }
    });

    // CREATE ROOM 

    socket.on("create-room",async ()=>{
        console.log("ROOM CREATION REQUEST");
        const roomId = genarateRoomId();
        rooms[roomId] = {
            owner: socket.id,
            history:[]
        }
        socket.join(roomId);
        socket.emit("room-created", roomId);
        console.log("Room created");
        try {
            const kickoff = {
                role: "user",
                content: "The candidate just joined. Introduce yourself in one sentence and ask your first interview question."
            };

            const aiReply = await askAI([kickoff]);

            rooms[roomId].history.push(kickoff);
            rooms[roomId].history.push({ role: "assistant", content: aiReply });

            io.to(roomId).emit("chat-message", {
                message: aiReply,
                room: roomId,
                sender: "ai",
                time: Date.now()
            });
        } catch (err) {
            console.error("Interview start failed:", err);
            io.to(roomId).emit("error-message", "Could not start interview");
        }
    });

    // socket.on("join-room",(roomId)=>{
    //     if(!rooms[roomId]){
    //         socket.emit("error-message", "ROOM NOT FOUND!!");
    //         return;
    //     }
    //     rooms[roomId].user.user2 = socket.id;
    //     socket.join(roomId);
    //     console.log("room successfully joined");
    //     console.log(rooms);
    // });

    socket.on("send-message",async ({message, room})=>{
        const roomData = rooms[room];
        if(!roomData) return;
        if(roomData.owner !== socket.id) return;


        roomData.history.push({role:"user",content: message});

        io.to(room).emit("chat-message",{
            message,
            room,
            sender:"user",
            time: Date.now()
        });
        try {
            const aiReply = await askAI(roomData.history);

            roomData.history.push({ role: "assistant", content: aiReply });
            io.to(room).emit("chat-message", {
                message: aiReply, room, sender: "ai", time: Date.now()
            });
        } catch (err) {
            console.error(err);
            io.to(room).emit("error-message", "AI failed to respond");
        }
    });
});

server.listen(5000, () => {
    console.log("Server Started on Port 5000");
});




async function askAI(history) {
    // 1. The interviewer rules
    const systemPrompt = {
        role: "system",
        content: `You are a professional job interviewer conducting a mock interview.
        Rules:
        - Introduce yourself in ONE short sentence at the start.
        - Ask only ONE question at a time.
        - Wait for the candidate's answer before asking the next question.
        - Ask realistic interview questions (background, skills, behavioral).
        - Keep every reply under 3 sentences.
        - Be friendly but professional.`
    };

    try {
        // 2. Call the Groq API
        const completion = await groq.chat.completions.create({
            // "llama-3.1-8b-instant" is incredibly fast and free.
            // You can also try "llama-3.3-70b-versatile" for smarter answers.
            model: "openai/gpt-oss-20b", 
            messages: [
                systemPrompt, 
                ...history
            ],
            temperature: 0.7, 
        });

        // 3. Return the AI's reply
        return completion.choices[0].message.content;

    } catch (error) {
        console.error("Groq API Error:", error);
        throw new Error("Failed to get response from AI");
    }
}

function genarateRoomId(){

    const characters = "ABCDFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let roomId = "";

    for(let i = 0; i<6; i++){
        const index = Math.floor(Math.random()*characters.length);
        roomId += characters[index];
    }

    return roomId;
}