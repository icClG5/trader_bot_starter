const pm2 = require("pm2");
const process = require("process");
const path = require("path");
const axios = require("axios");
const currentFilePath = path.resolve(__dirname);
const { parameterHandler, clearPosition, uploadStatus } = require("./utils");
const { startRunKucoin } = require("./kucoin_trader_bot_starter");
// eslint-disable-next-line no-shadow-restricted-names
const [
  process_name,
  action,
  updateStatusApi,
  account_id,
  trader_bot_args,
  isKucoin,
] = process.argv.splice(2);

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
        if (isKucoin) {
          startRunKucoin(process_name, trader_bot_args);
        } else {
          pm2.start({
            script: path.resolve(currentFilePath, `../HFT -c "${execParams}"`),
            name: process_name,
            cwd: path.resolve(currentFilePath, "../"),
          });
        }
        startSyncStatus(sync_status_bot_name);
      });
    } else if (action === "stop") {
      console.log("====== enter stop ======");
      // stopStatusSync(updateStatusApi, account_id);
      pm2.stop(process_name, function (err) {
        try {
          clearPosition(trader_bot_args);
        } catch (e) {
          console.log(e, "======= clearPosition =====");
        }
        pm2.stop(sync_status_bot_name, function (err) {
          if (!err) {
            stopStatusSync(updateStatusApi, account_id);
            // process.exit(0);
          } else {
            stopStatusSync(updateStatusApi, account_id);
            // process.exit(1);
            // errorHandle(err);
          }
        });
        if (!err) {
          stopStatusSync(updateStatusApi, account_id);
        } else {
          stopStatusSync(updateStatusApi, account_id);
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
      args: [updateStatusApi, process_name, account_id],
      cwd: path.resolve(currentFilePath),
    },
    function (err) {
      if (!err) {
        uploadStatus(updateStatusApi, process_name, account_id, () => {
          process.exit(0);
        });
      } else {
        process.exit(1);
      }
    }
  );
}

function stopStatusSync(updateStatusApi, account_id) {
  axios
    .post(updateStatusApi, {
      key: "pm2_status",
      data: JSON.stringify({
        id: Number(account_id),
        data: {
          pm_uptime: Date.now(),
          created_at: Date.now(),
          uptime: Date.now(),
          status: "stopped",
        },
      }),
    })
    .then(() => {
      console.log(
        `======= account_id:${account_id} stop sync status success ======`
      );
      process.exit(0);
    })
    .catch(() => {
      process.exit(3);
    });
}

function errorHandle(errMsg = "") {
  console.error(errMsg);
  process.exit(2);
}
