const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://immo229.000webhostapp.com",
    methods: ["GET", "POST"],
  },
});

app.get("/:data", function (req, res) {
  
  // console.log(req.params.data)
  res.sendFile(__dirname + "/data/" + req.params.data + ".json");
  
})

io.on("connection", function(socket){
  console.log("a user is connected");


  socket.on("disconnect", function(){
      console.log("a user is disconnect");
  })

  socket.on("chat data", function(data){
      console.log("message Event: " + data.Event);
      console.log("message reçu: " + data.message);

      const msgPath = "./data/" + data.Id + ".json"
      const senderMsgList = "./data/msglist_" + data.sender + ".json"
      const receiverMsgList = "./data/msglist_" + data.Event + ".json"


      fs.readFile(msgPath, "utf8", (err, Stringdata)=>{

        if (!err) {
          let msgJson = JSON.parse(Stringdata)
          if (msgJson.Infos.Id === data.Id) {

            // Récupérer la date actuelle
            const dateActuelle = new Date();

            // Extraire le jour, le mois et l'année
            const jour = String(dateActuelle.getDate()).padStart(2, '0');
            const mois = String(dateActuelle.getMonth() + 1).padStart(2, '0'); // Attention : les mois vont de 0 à 11
            const annee = dateActuelle.getFullYear();

            // Concaténer la date au format JJ/MM/AAAA
            const dateFormatted = `${jour}/${mois}/${annee}`;

            // Extraire l'heure, les minutes et les secondes
            const heures = String(dateActuelle.getHours()).padStart(2, '0');
            const minutes = String(dateActuelle.getMinutes()).padStart(2, '0');
            const secondes = String(dateActuelle.getSeconds()).padStart(2, '0');

            // Concaténer l'heure au format HH:MM:SS
            const heureFormatted = `${heures}:${minutes}:${secondes}`;

            const ip = socket.handshake.address;

            const newMsg = {
              sender: data.sender,
              senderProfil : data.senderProfil,
              Date : dateFormatted,
              Hours : heureFormatted,
              IP : ip,
              type : "text",
              Content : data.message
            }

            msgJson.messages[msgJson.messages.length] = newMsg;

            fs.writeFile(msgPath, JSON.stringify(msgJson), (err)=>{

              if (!err) {

                fs.readFile(senderMsgList, "utf8", (err, Stringdata)=>{

                  if (!err) {
                    let senderMsgListJson = JSON.parse(Stringdata);
                    let senderMsgListJson1 = senderMsgListJson;

                    let ListItem;

                    senderMsgListJson1.forEach((element, index) => {
                      if (element.Id === data.Id) {
                        ListItem = senderMsgListJson.splice(index, 1);
                      }
                    });

                    ListItem[0].Date = dateFormatted;
                    ListItem[0].Hours = heureFormatted;
                    ListItem[0].lasTess = data.message;

                    senderMsgListJson.push(ListItem[0]);

                    fs.writeFile(senderMsgList, JSON.stringify(senderMsgListJson), (err1)=>{
                      if (!err1) {
                        io.emit("msglist_" + data.sender, JSON.stringify(senderMsgListJson));

                        fs.readFile(receiverMsgList, "utf8", (err, Stringdata)=>{

                          if (!err) {
                            let receiverMsgListJson = JSON.parse(Stringdata);
                            let receiverMsgListJson1 = receiverMsgListJson;
        
                            let ListItem;
        
                            receiverMsgListJson1.forEach((element, index) => {
                              if (element.Id === data.Id) {
                                ListItem = receiverMsgListJson.splice(index, 1);
                              }
                            });
        
                            ListItem[0].Date = dateFormatted;
                            ListItem[0].Hours = heureFormatted;
                            ListItem[0].lasTess = data.message;
        
                            receiverMsgListJson.push(ListItem[0]);

                            fs.writeFile(receiverMsgList, JSON.stringify(receiverMsgListJson), (err2)=>{
                              if (!err2) {
                                io.emit("msglist_" + data.Event, JSON.stringify(receiverMsgListJson));

                                // io.emit(data.Event, newMsg);
                                // io.emit(data.sender + "_emit_" + data.Event, newMsg);
                                io.emit(msgJson.Infos.Id, newMsg);
                                
                              }else{
                                console.log("Une erreur s'est produite:" + err2)
                              }
                            })

                          }else{
                            console.log("Une erreur s'est produite:" + err)
                          }
                  
                        })
                      }                      
                    })

                    
                  }else{
                    console.log("Une erreur s'est produite:" + err)
                  }
          
                })

                
              }
            })

            
          }

        }else{
          console.log("Une erreur s'est produite:" + err)
        }

      })



  })
})


server.listen(5000, () => {
  console.log("SERVER IS RUNNING on 5000");
});
