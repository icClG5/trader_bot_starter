const pm2 = require("pm2");
const process = require("process");
const path = require("path");
const WebSocket = require("ws");

const currentFilePath = path.resolve(__dirname);
const { parameterHandler } = require("./utils");
// eslint-disable-next-line no-shadow-restricted-names
const [process_name, action, ws_address, account_id, trader_bot_args] =
  process.argv.splice(2);

let ws, interval;
pm2.connect(function (err) {
  if (err) {
    errorHandle(err);
  }
  const func = action && pm2[action];
  if (func) {
    const sync_status_bot_name = `${process_name}_async_status_bot`;
    if (action === "start") {
      // parameter handler
      const execParams = parameterHandler(
        trader_bot_args,
        currentFilePath,
        process_name
      );

      pm2.list(function (listError, list) {
        if (listError) {
          errorHandle(`pm2.list error ${listError}`);
        }
        const currentProcess = list.find((item) => item.name === process_name);
        if (currentProcess) {
          pm2.restart(process_name);
        } else {
          pm2.start(
            {
              script: path.resolve(
                currentFilePath,
                `../HFT -c "${execParams}"`
              ),
              name: process_name,
              cwd: path.resolve(currentFilePath, "../"),
            },
            function (err) {
              if (!err) {
                pm2.start({
                  script: path.resolve(
                    `./sync_status_bot.js ${ws_address} ${process_name} ${account_id}`
                  ),
                  name: sync_status_bot_name,
                });
                process.exit(0);
              } else {
                errorHandle(err);
              }
            }
          );
        }
      });
    } else if (action === "stop") {
      pm2.stop(process_name, function (err) {
        if (!err) {
          stopStatusSync(ws_address, account_id);
          process.exit(0);
        } else {
          errorHandle(err);
        }
      });
      pm2.stop(sync_status_bot_name, function (err) {
        if (!err) {
          process.exit(0);
        } else {
          errorHandle(err);
        }
      });
    }
  }
});

function stopStatusSync(wsAddress, account_id) {
  clearWs();
  const ws = new WebSocket(wsAddress);
  ws.on("open", function open() {
    ws.send(
      JSON.stringify({
        id: Number(account_id),
        data: {
          pm_uptime: Date.now(),
          created_at: Date.now(),
          uptime: Date.now(),
          status: "stopped",
        },
      }),
      (err) => {
        if (!err) {
          clearWs();
        }
      }
    );
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
