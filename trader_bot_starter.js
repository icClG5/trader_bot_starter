const pm2 = require("pm2");
const process = require("process");
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const path = require("path");
const currentFilePath = path.resolve(__dirname);
const { parameterHandler } = require("./utils");
var arguments = process.argv.splice(2);

const [process_name, action, trader_bot_args] = arguments;

pm2.connect(function (err) {
  if (err) {
    console.error(err);
    process.exit(2);
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
          script: path.resolve(currentFilePath, `../HFT -c ${execParams}`),
          name: process_name,
          cwd: path.resolve(currentFilePath, "../"),
        },
        function (err) {
          if (!err) {
            console.log("start success");
            //TODO: 成功后【开启】状态更新，如进程状态，账号余额/收益情况
          } else {
            console.error(err);
            process.exit(2);
          }
        }
      );
    } else if (action === "stop") {
      pm2.stop(process_name, function (err) {
        if (!err) {
          console.log("stop success");
          //TODO: 成功后【关闭】 状态更新，如进程状态，账号余额/收益情况
          pm2.stop("trader_bot_starter", function (err) {
            if (err) {
              process.exit(1);
            } else {
              process.exit(0);
            }
          });
        } else {
          process.exit(1);
          console.error(err);
        }
      });
    }
  }
});
