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
    // clearWs();
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
            const {
              pm2_env: { status, pm_uptime, created_at },
            } = currentProcess;
            ws.send(
              JSON.stringify(
                {
                  id: Number(account_id),
                  data: { status, pm_uptime, created_at, uptime: Date.now() },
                },
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
              )
            );
          });
        }
        uploadStatus();
        interval = setInterval(uploadStatus, 1000 * 60 * 5);
      });
    });

    ws.on("close", () => {
      console.log("ws close");
      // clearInterval(interval);
      // startStatusSync();
    });
  } catch (e) {
    process.exit(1);
  }
}

(function () {
  setInterval(() => {
    console.log("setInterval");
  }, 1000);
})();
startStatusSync(wsAddress, pm2ProcessName, account_id);
