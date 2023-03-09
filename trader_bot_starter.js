const pm2 = require("pm2");
const process = require("process");
const path = require("path");
const WebSocket = require("ws");

const currentFilePath = path.resolve(__dirname);
const { parameterHandler, clearPosition } = require("./utils");
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
    const sync_status_bot_name = `${process_name}_sync_status_bot`;
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
        console.log(currentProcess, "currentProcess");
        if (currentProcess) {
          pm2.stop(process_name);
          pm2.stop(sync_status_bot_name);
        }
        pm2.start({
          script: path.resolve(currentFilePath, `../HFT -c "${execParams}"`),
          name: process_name,
          cwd: path.resolve(currentFilePath, "../"),
        });
        startSyncStatus(sync_status_bot_name);
      });
    } else if (action === "stop") {
      console.log("====== enter stop ======");
      // stopStatusSync(ws_address, account_id);
      pm2.stop(process_name, function (err) {
        if (!err) {
          stopStatusSync(ws_address, account_id);
          clearPosition(trader_bot_args);
          pm2.stop(sync_status_bot_name, function (err) {
            if (!err) {
              stopStatusSync(ws_address, account_id);
              // process.exit(0);
            } else {
              stopStatusSync(ws_address, account_id);
              // process.exit(1);
              // errorHandle(err);
            }
          });
        } else {
          stopStatusSync(ws_address, account_id);
          console.log(`====== stop error: ${err} ======`);
          // errorHandle(err);
        }
      });
    }
  }
});

function startSyncStatus(sync_status_bot_name) {
  console.log(startSyncStatus, "startSyncStatus");
  pm2.start(
    {
      script: path.resolve(currentFilePath, "./sync_status_bot.js"),
      name: sync_status_bot_name,
      args: [ws_address, process_name, account_id],
      cwd: path.resolve(currentFilePath),
    },
    function (err) {
      if (!err) {
        process.exit(0);
      }
      process.exit(1);
    }
  );
}

function stopStatusSync(wsAddress, account_id) {
  clearWs();
  const ws = new WebSocket(wsAddress);
  console.log("====== enter inner stop ======");
  ws.on("open", function open() {
    console.log(
      `======= account_id:${account_id} stop sync status start ======`
    );
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
          console.log(
            `======= account_id:${account_id} stop sync status success ======`
          );
          ws.close();
          clearWs();
          process.exit(0);
        }
        process.exit(1);
      }
    );
  });
  ws.on("close", function () {
    process.exit(0);
    console.log("====== ws close ======");
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
