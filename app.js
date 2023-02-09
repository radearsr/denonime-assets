const express = require("express");
const path = require("path");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");

const app = express();

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    const [, ext] = file.mimetype.split("/");
    cb(null, `$img-${Date.now()}.${ext}`);
  },
});
const upload = multer({
  storage: multerStorage,
});
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/static", express.static(path.join(__dirname, "public")));

const downloadImage = async (link, filename) => {
  const directory = path.resolve(__dirname, "public/images", `${filename}.jpg`);
  const writer = fs.createWriteStream(directory);
  console.log(writer);
  const response = await axios({
    url: link,
    method: "GET",
    responseType: "stream",
  });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

app.post("/downloader", async (req, res) => {
  try {
    console.log(req.headers.host);
    const filename = `img-${Date.now()}`;
    await downloadImage(req.body.link, filename);
    res.json({
      status: "success",
      data: {
        filename,
        access: `${req.headers.host}/static/images/${filename}.jpg`
      },
    });
  } catch (error) {
    res.json({
      status: "error",
      data: error,
    });   
  }
});

app.post("/upload", upload.array("files"), (req, res) => {
  try {
    res.json({
      status: "success",
      data: {
        filename: req.files.filename
      },
    });
  } catch (error) {
    res.json({
      status: "error",
      error,
    });
  }
});

app.get("/", (req, res) => {
  const ipAddress = req.header("x-forwarded-for") || req.socket.remoteAddress;
  res.send(`
    <center>
      <h1>Welcome To Denonime Asset Manager</h1>
      <h4>Client From ${ipAddress}</h4>
    <center>
  `);
});

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});