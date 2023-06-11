// create a basic node js with express app
const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const app = express();
const port = 3001;
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});

server.listen(port, () => {
  console.log("listening on *:", port);
});
const allSessionsObject = {};
const createWhatsappSession = (id, socket) => {
  const client = new Client({
    puppeteer: {
      headless: false,
    },
    authStrategy: new LocalAuth({
      clientId: id,
    }),
  });

  client.on("qr", (qr) => {
    console.log("QR RECEIVED", qr);
    socket.emit("qr", {
      qr,
    });
  });

  client.on("authenticated", () => {
    console.log("AUTHENTICATED");
  });
  client.on("ready", () => {
    console.log("Client is ready!");
    allSessionsObject[id] = client;
    socket.emit("ready", { id, message: "Client is ready!" });
  });

  client.initialize();
};

io.on("connection", (socket) => {
  console.log("a user connected", socket?.id);
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("connected", (data) => {
    console.log("connected to the server", data);
    // emit hello
    socket.emit("hello", "Hello from server");
  });

  socket.on("createSession", (data) => {
    console.log(data);
    const { id } = data;
    createWhatsappSession(id, socket);
  });

  socket.on("getAllChats", async (data) => {
    console.log("getAllChats", data);
    const { id } = data;
    const client = allSessionsObject[id];
    const allChats = await client.getChats();
    socket.emit("allChats", {
      allChats,
    });
  });
});
