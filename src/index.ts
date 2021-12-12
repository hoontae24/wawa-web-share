import dayjs from "dayjs";
import dotenv from "dotenv";
import Express from "express";
import path from "path";

import { createConnection } from "./connection";
import { QueryManager } from "./query";

dotenv.config();

const port = process.env.PORT;
const server = process.env.DB_SERVER;
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;

if (!server || !username || !password || !database) {
  throw new Error(
    'No Database configs, Fill out ".env" referred to ".env.defaults"'
  );
}

const app = Express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.get("/", (req, res) => {
  const { seq } = req.query;

  if (!seq) {
    return res.status(404).render("404");
  }
  createConnection({
    server: process.env.DB_SERVER!,
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  })
    .then((conn) => new QueryManager(conn))
    .then((query) => query.execute(Number(seq)))
    .then((result) => {
      if (result) {
        const data = result.reduce((data, column) => {
          data[column.metadata.colName] = column.value;
          return data;
        }, {} as Record<string, any>);
        return data;
      }
    })
    .then((data) => {
      if (!data) return res.render("404");

      const content = data.USD_TEXT.split("\n")[0];
      const youtubeHash = (data.USD_SITE || "").includes("youtu.be")
        ? data.USD_SITE.split("/").pop()
        : (data.USD_SITE || "").includes("youtube.com/watch")
        ? data.USD_SITE.split("watch?")
            .pop()
            ?.split("&")
            .find((q: string) => q.startsWith("v="))
            ?.slice(2)
        : "";

      const ns = {
        appDownloadUrl: process.env.APP_DOWNLOAD_URL,
        title:
          data.USD_NAME ||
          (content.length > 30 ? content.slice(0, 30) + "..." : content),
        user: {
          profileImage: data.MUR_IMG,
          name: data.MUR_NIC_NAME,
          mainName: data.MAIN_NAME,
          entymd: data.USD_ENTYMD
            ? dayjs(data.USD_ENTYMD).format("YYYY-MM-DD")
            : "",
        },
        content: data.USD_TEXT,
        video: data.USD_SITE,
        youtubeHash: youtubeHash,
        images: [
          data.USD_IMG_1,
          data.USD_IMG_2,
          data.USD_IMG_3,
          data.USD_IMG_4,
          data.USD_IMG_5,
          data.USD_IMG_6,
          data.USD_IMG_7,
          data.USD_IMG_8,
          data.USD_IMG_9,
          data.USD_IMG_10,
        ].map((src) => {
          if (!src) return src;
          return src.startsWith("http")
            ? src
            : process.env.STATIC_FILE_HOST_PREFIX + src;
        }),
        imageContents: [
          data.USD_CON_1,
          data.USD_CON_2,
          data.USD_CON_3,
          data.USD_CON_4,
          data.USD_CON_5,
          data.USD_CON_6,
          data.USD_CON_7,
          data.USD_CON_8,
          data.USD_CON_9,
          data.USD_CON_10,
        ],
      };
      res.render("post.ejs", ns);
    })
    .catch((err) => res.status(500).render("500"));
});

app.listen(port, () => console.log(`Server is started on ${port}`));
