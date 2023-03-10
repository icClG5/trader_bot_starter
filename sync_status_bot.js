let ws, interval;
const WebSocket = require("ws");
const pm2 = require("pm2");
const process = require("process");

const [wsAddress, pm2ProcessName, account_id] = process.argv.splice(2);

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
function startStatusSync(wsAddress, pm2ProcessName, account_id) {
  console.log("startStatusSync", wsAddress, pm2ProcessName, account_id);
  try {
    clearWs();
    ws = new WebSocket(wsAddress);
    ws.on("open", function open() {
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
              ws.send(
                JSON.stringify({
                  id: Number(account_id),
                  data: { status, pm_uptime, created_at, uptime: Date.now() },
                }),
                function (err) {
                  if (err) {
                    console.error(
                      `======= account_id:${account_id}  start sync fail ======`
                    );
                  } else {
                    console.log(
                      `======= account_id:${account_id} start sync  ${status}  success !!! ======`
                    );
                  }
                }
              );
            } catch (err) {
              console.log(err, "==== ws.send error ====");
            }
          });
        }
        uploadStatus();
        interval = setInterval(uploadStatus, 5 * 1000 * 60);
      });
    });

    ws.on("close", () => {
      console.log(interval, "ws close");
      clearInterval(interval);
    });
  } catch (e) {
    console.log(e, "error catch");
    process.exit(1);
  }
}

startStatusSync(wsAddress, pm2ProcessName, account_id);
