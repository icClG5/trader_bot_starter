const process = require("process");
// const axios = require("axios");
const { uploadStatus } = require("./utils");
const [updateStatusApi, pm2ProcessName, account_id] = process.argv.splice(2);
let interval;
function startStatusSync(updateStatusApi, pm2ProcessName, account_id) {
  console.log("startStatusSync", updateStatusApi, pm2ProcessName, account_id);
  clearInterval(interval);
  try {
    uploadStatus(updateStatusApi, pm2ProcessName, account_id);
    interval = setInterval(
      () => uploadStatus(updateStatusApi, pm2ProcessName, account_id),
      5 * 1000 * 60
    );
  } catch (e) {
    clearInterval(interval);
    console.log(e, "error catch");
    process.exit(1);
  }
}

startStatusSync(updateStatusApi, pm2ProcessName, account_id);
