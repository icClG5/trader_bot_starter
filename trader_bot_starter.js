const pm2 = require("pm2");
const process = require("process");
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const path = require("path");
const WebSocket = require("ws");
const fs = require("fs");

const currentFilePath = path.resolve(__dirname);
const { parameterHandler } = require("./utils");
var arguments = process.argv.splice(2);
const [process_name, action, ws_address, account_id, trader_bot_args] =
  arguments;

let ws, interval;
pm2.connect(function (err) {
  if (err) {
    errorHandle(err);
  }
  const func = action && pm2[action];
  if (func) {
    if (action === "start") {
      // parameter handler
      const execParams = parameterHandler(
        trader_bot_args,
        currentFilePath,
        process_name
      );

      pm2.start(
        {
          script: path.resolve(currentFilePath, `../HFT -c '${execParams}'`),
          name: process_name,
          cwd: path.resolve(currentFilePath, "../"),
        },
        function (err) {
          if (!err) {
            //TODO: 成功后【开启】状态更新，如进程状态，账号余额/收益情况
            pm2.list(function (e, list) {
              console.log(list, "list");
            });
            pm2StatusSync(ws_address, process_name, account_id);
          } else {
            errorHandle(err);
          }
        }
      );
    } else if (action === "stop") {
      stopStatusSync(ws_address, account_id);
      pm2.stop(process_name, function (err) {
        if (!err) {
          console.log("stop success");
          //TODO: 成功后【关闭】 状态更新，如进程状态，账号余额/收益情况
          pm2.stop("trader_bot_starter", function (err) {
            if (err) {
              errorHandle(err);
            } else {
              clearWs();
              process.exit(0);
            }
          });
        } else {
          errorHandle(err);
        }
      });
    }
  }
});

function stopStatusSync(wsAddress, account_id) {
  clearWs();
  ws = new WebSocket(wsAddress);
  ws.on("open", function open() {
    ws.send(
      JSON.stringify({
        id: Number(account_id),
        data: {
          pm_uptime,
          created_at,
          uptime: Date.now(),
          status: "stopped",
        },
      })
    );
  });
}

function pm2StatusSync(wsAddress, pm2ProcessName, account_id) {
  clearWs();
  ws = new WebSocket(wsAddress);
  ws.on("open", function open() {
    pm2.connect(function (err) {
      if (err) {
        errorHandle(` pm2.connect error ${err}`);
      }
      interval = setInterval(() => {
        pm2.list(function (listError, list) {
          if (listError) {
            errorHandle(`pm2.list error ${listError}`);
          }
          const currentProcess = list.find(
            (item) => item.name === pm2ProcessName
          );
          const {
            pm2_env: { status, pm_uptime, created_at },
          } = currentProcess;
          ws.send(
            JSON.stringify({
              id: Number(account_id),
              data: { status, pm_uptime, created_at, uptime: Date.now() },
            })
          );
        });
      }, 5000);
    });
  });

  ws.on("close", () => {
    console.log("ws close");
    clearInterval(interval);
  });
}

function clearWs() {
  clearInterval(interval);
  if (ws && ws.close) {
    ws.close();
  }
}

function errorHandle(errMsg = "") {
  console.error(errMsg);
  process.exit(2);
}
