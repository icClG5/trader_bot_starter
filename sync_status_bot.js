const pm2 = require("pm2");
const process = require("process");
// const axios = require("axios");
const { uploadStatus } = require("./utils");
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
      // function uploadStatus() {
      //   console.log(
      //     `======= account_id:${account_id} start sync status ======`
      //   );
      //   pm2.list(function (listError, list) {
      //     if (listError) {
      //       errorHandle(`pm2.list error ${listError}`);
      //     }
      //     const currentProcess = list.find(
      //       (item) => item.name === pm2ProcessName
      //     );
      //     let status, pm_uptime, created_at;
      //     try {
      //       if (currentProcess) {
      //         status = currentProcess.pm2_env.status;
      //         pm_uptime = currentProcess.pm2_env.pm_uptime;
      //         created_at = currentProcess.pm2_env.created_at;
      //       } else {
      //         status = "online";
      //         pm_uptime = Date.now();
      //         created_at = Date.now();
      //       }
      //     } catch (err) {
      //       console.log(err, "==== get currentProcess error ====");
      //     }
      //     axios
      //       .post(updateStatusApi, {
      //         key: "pm2_status",
      //         data: JSON.stringify({
      //           id: Number(account_id),
      //           data: { status, pm_uptime, created_at, uptime: Date.now() },
      //         }),
      //       })
      //       .then((res) => {
      //         console.log(res, "======= axios response =======");
      //         if (res.data.error) {
      //           `======= account_id:${account_id} start sync  ${status}  error !!! =======`;
      //         } else {
      //           console.log(
      //             `======= account_id:${account_id} start sync  ${status}  success !!! =======`
      //           );
      //         }
      //       })
      //       .catch(() => {
      //         console.error(
      //           `======= account_id:${account_id}  start sync fail =======`
      //         );
      //       });
      //   });
      // }
      // uploadStatus(updateStatusApi, pm2ProcessName, account_id);
      // interval = setInterval(uploadStatus, 5 * 1000 * 60);
    });
    uploadStatus(updateStatusApi, pm2ProcessName, account_id);
    interval = setInterval(uploadStatus, 5 * 1000 * 60);
  } catch (e) {
    clearInterval(interval);
    console.log(e, "error catch");
    process.exit(1);
  }
}

startStatusSync(updateStatusApi, pm2ProcessName, account_id);
