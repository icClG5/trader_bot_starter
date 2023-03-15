const pm2 = require("pm2");
const process = require("process");
const axios = require("axios");
const [updateStatusApi, pm2ProcessName, account_id] = process.argv.splice(2);
let interval;
function errorHandle(errMsg = "") {
  console.error(errMsg);
  process.exit(2);
}
function startStatusSync(updateStatusApi, pm2ProcessName, account_id) {
  console.log("startStatusSync", updateStatusApi, pm2ProcessName, account_id);
  clearInterval(interval);
  try {
    pm2.connect(function (err) {
      if (err) {
        errorHandle(` pm2.connect error ${err}`);
      }
      function uploadStatus() {
        console.log(
          `======= account_id:${account_id} start sync status ======`
        );
        pm2.list(function (listError, list) {
          if (listError) {
            errorHandle(`pm2.list error ${listError}`);
          }
          const currentProcess = list.find(
            (item) => item.name === pm2ProcessName
          );
          try {
            const {
              pm2_env: { status, pm_uptime, created_at },
            } = currentProcess;
            axios
              .post(updateStatusApi, {
                key: "pm2_status",
                data: JSON.stringify({
                  id: Number(account_id),
                  data: { status, pm_uptime, created_at, uptime: Date.now() },
                }),
              })
              .then(() => {
                console.log(
                  `======= account_id:${account_id} start sync  ${status}  success !!! =======`
                );
              })
              .catch(() => {
                console.error(
                  `======= account_id:${account_id}  start sync fail =======`
                );
              });
          } catch (err) {
            console.log(err, "==== ws.send error ====");
          }
        });
      }
      uploadStatus();
      interval = setInterval(uploadStatus, 5 * 1000 * 60);
    });
  } catch (e) {
    clearInterval(interval);
    console.log(e, "error catch");
    process.exit(1);
  }
}

startStatusSync(updateStatusApi, pm2ProcessName, account_id);
