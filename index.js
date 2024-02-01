const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mysql = require('mysql2');
const { init: initDB, Counter } = require("./db");
// 从环境变量中读取数据库配置
const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_ADDRESS = "" } = process.env;
const [host_mysql, port_mysql] = MYSQL_ADDRESS.split(":");

const logger = morgan("tiny");

const app = express();
// 创建mysql连接
const connection = mysql.createConnection({
  host: host_mysql,
  port: port_mysql,
  user: MYSQL_USERNAME,
  password: MYSQL_PASSWORD,
  database: 'nodejs_demo'
});
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ' + err.stack);
    return;
  }
  console.log('Connected to database');
});
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
// 创建路由获取test表的name字段
app.get('/test', (req, res) => {
  connection.query('SELECT name FROM test', (error, results, fields) => {
    if (error) {
      console.error('Error querying database: ' + error.stack);
      res.status(500).send('Error querying database');
      return;
    }
    res.json(results);
  });
});
// 更新计数
app.post("/api/count", async (req, res) => {
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
