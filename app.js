const express = require("express");
const path = require("path");
const axios = require("axios");
const fs = require("fs");

const app = express();

const port = 3030;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/static", express.static(path.join(__dirname, "public")));

const downloadImage = async (link, filename) => {
  const directory = path.resolve(__dirname, "public/images", `${filename}.jpg`);
  const writer = fs.createWriteStream(directory);
  const response = await axios({
    url: link,
    method: "GET",
    responseType: "stream",
  });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve(`${filename}.jpg`));
    writer.on("error", reject);
  });
};

app.post("/upload", async (req, res) => {
  try {
    const { poster, title } = req.body;
    if (!poster || !title) {
      res.statusCode = 400;
      return res.send({
        status: "fail",
        message: "poster dan title tidak boleh kosong",
      }); 
    } 
    const uploadedFilename = await downloadImage(req.body.poster, req.body.title);
    // console.log(uploadedFilename);
    const protocol = process.env.NODE_ENV === "production" ? process.env.PROTOKOL_PROD : process.env.PROTOKOL_DEV; 
    res.statusCode = 201;
    res.json({
      status: "success",
      data: {
        filename: uploadedFilename,
        access: `${protocol}://${req.headers.host}/static/images/${uploadedFilename}`
      },
    });
  } catch (error) {
    // console.log(error);
    res.statusCode = 500;
    res.json({
      status: "error",
      message: error.message,
    });
  }
});

app.get("/", (req, res) => {
  let ipAddress = req.header("x-forwarded-for") || req.socket.remoteAddress;
  if (ipAddress.includes(",")) {
    [ipAddress] = ipAddress.split(",");
  }
  res.send(`
    <center>
      <h1>Welcome To Denonime Asset Manager</h1>
      <h4>Accessed From ${ipAddress}</h4>
    <center>
  `);
});

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});