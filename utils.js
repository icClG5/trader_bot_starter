const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const currentFilePath = path.resolve(__dirname);
const pm2 = require("pm2");
const process = require("process");
const axios = require("axios");

const { exec } = require("child_process");

function deleteAllStopProcess() {
  exec(
    "pm2 list | grep 'stopped' | awk '{print $2}' | xargs | xargs pm2 delete",
    (err, stdout, stderr) => {
      if (err) {
        console.error(`exec error: ${err}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    }
  );
}

function errorHandle(errMsg = "") {
  console.error(errMsg);
  process.exit(2);
}

function parameterHandler(trader_bot_args, currentFilePath, process_name) {
  let execParams;
  let trader_bot_args_transformed = trader_bot_args
    .split("/")
    .reduce((result, item) => {
      const [key, value] = item.split("=");
      result[key] = value;
      return result;
    }, {});

  const execPath = path.resolve(
    currentFilePath,
    `../${process_name}_config.cfg`
  );

  if (fs.existsSync(execPath)) {
    // 清理之前的参数文件
    fs.unlinkSync(execPath);
  }

  console.log(trader_bot_args, "trader_bot_args");
  execParams = JSON.stringify(trader_bot_args_transformed).replace(/"/g, '\\"');
  console.log(execParams, "execParams");
  fs.writeFileSync(execPath, execParams, function (err) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
  });
  return execParams;
}

function clearPosition(param_str) {
  const obj = param_str.split("/").reduce((acc, item) => {
    const [key, value] = item.split("=");
    acc[key] = value;
    return acc;
  }, {});

  const keyValueArr = Object.entries(obj);
  const keyValueStr = keyValueArr
    .map(([key, value]) => `${key} = "${value}"`)
    .join("\n");

  fs.writeFileSync(
    path.resolve(currentFilePath, "../clean_position/config.toml"),
    keyValueStr
  );

  const pythonProcess = spawn(
    "python3",
    [
      path.resolve(currentFilePath, "../clean_position/run_quit.py"),
      "-c",
      "config.toml",
    ],
    {
      cwd: path.resolve(currentFilePath, "../clean_position"),
    }
  );

  pythonProcess.stdout.on("data", (data) => {
    console.log(`Python script output: ${data}`);
    // process.exit(0);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Python script error: ${data}`);
    // process.exit(1);
  });

  pythonProcess.on("close", (code) => {
    console.log(`Python script exited with code ${code}`);
    // process.exit(2);
  });
}

function uploadStatus(updateStatusApi, pm2ProcessName, account_id, cb) {
  console.log(`======= account_id:${account_id} start sync status ======`);
  pm2.connect(function (err) {
    if (err) {
      errorHandle(` pm2.connect error ${err}`);
    }
    pm2.list(function (listError, list) {
      if (listError) {
        errorHandle(`pm2.list error ${listError}`);
      }
      const currentProcess = list.find((item) => item.name === pm2ProcessName);
      let status, pm_uptime, created_at;
      try {
        if (currentProcess) {
          status = currentProcess.pm2_env.status;
          pm_uptime = currentProcess.pm2_env.pm_uptime;
          created_at = currentProcess.pm2_env.created_at;
        } else {
          status = "online";
          pm_uptime = Date.now();
          created_at = Date.now();
        }
      } catch (err) {
        console.log(err, "==== get currentProcess error ====");
      }
      console.time();
      axios
        .post(updateStatusApi, {
          key: "pm2_status",
          data: JSON.stringify({
            id: Number(account_id),
            data: { status, pm_uptime, created_at, uptime: Date.now() },
          }),
        })
        .then((res) => {
          console.log(res.data, "======= axios response =======");
          if (res.data.error) {
            `======= account_id:${account_id} start sync  ${status}  error !!! =======`;
          } else {
            console.log(
              `======= account_id:${account_id} start sync  ${status}  success !!! =======`
            );
          }
        })
        .catch((err) => {
          console.error(
            err,
            `======= account_id:${account_id}  start sync fail =======`
          );
        })
        .finally(() => {
          console.log(
            `======= account_id:${account_id}  ${console.timeEnd()} time end =======`
          );
          if (cb) {
            cb();
          }
        });
      if (cb) {
        cb();
      }
    });
  });
}

module.exports = {
  parameterHandler,
  clearPosition,
  uploadStatus,
  deleteAllStopProcess,
};
