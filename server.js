const express = require('express');
const router = express.Router();
const fs = require('fs');
const { exec } = require('child_process');
const socket = require("socket.io");

const app = express();

// Set ejs template engine
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

const assets = 'public/assets';
const videName = 'nature'; // without extension

router.get('/', (req, res) => {

    fs.access(assets + '/images/' + videName + '.jpg', fs.F_OK, (err) => {

        if (err) {
            exec(`bin/ffmpeg -i ${assets}/${videName}.mp4 -ss 00:00:04.00 -r 1 -an -vframes 1 -f mjpeg ${assets}/images/${videName}.jpg`, (error, stdout, stderr) => {
                if (error) {
                    return;
                }

                res.render('index', {
                    image: `/assets/images/${videName}.jpg`
                });
            });
        }

        if (err === null) {
            res.render('index', {
                image: `/assets/images/${videName}.jpg`
            });
        }
    });
});


router.get('/video', (req, res) => {
    console.log("video")

    const path = `${assets}/${videName}.mp4`;
    console.log(path)

    fs.stat(path, (err, stat) => {

        // Handle file not found
        if (err !== null && err.code === 'ENOENT') {
            res.sendStatus(404);
        }

        const fileSize = stat.size
        const range = req.headers.range

        if (range) {

            const parts = range.replace(/bytes=/, "").split("-");

            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(path, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            }

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            }

            res.writeHead(200, head);
            fs.createReadStream(path).pipe(res);
        }
    });
});

app.use(router);

const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server listening on port ${PORT}`);
// });

const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

global.connection = socket(server);

global.nsp = connection.of("/socketio");

//chat function  currently working 
nsp.on("connection", function (s) {

    s.on("room-join", socketData => {
        const user = { id: s.id, userName: socketData.userId, room: "jjskaenhffoaweanslaner" }
        connectedUsers.push(user);
        s.join(user.room);

        s.on("host-video-action", async socketData => {
            console.log("socketData", socketData)
            // const user = connectedUsers.find(user => user.id === s.id);
            // const payload = { userId: socketData.userId, message: socketData.message, roomId: socketData.roomId };
            // const message = new chatSchema(payload);

            // message.save();

            // s.to(user.room).emit("new-message", socketData.message)
        })
        //-----------new
    });

    s.on("disconnect", function () {
        // connectedUsers = connectedUsers.filter(item => item.socketId !== s.id);
        s.leave(s.id);
    });

});