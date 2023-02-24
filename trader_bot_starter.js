const pm2 = require("pm2");
const process = require("process");
const CryptoJS = require("crypto-js");
const crypto = require("crypto");

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
      try {
        let trader_bot_args_transformed = JSON.parse(
          "{" + trader_bot_args.split("b{")[1]
        );
        // TODO:参数处理
        console.log(trader_bot_args_transformed, "trader_bot_args_transformed");
      } catch (e) {
        console.log(e);
      }

      pm2.start(
        {
          script: "./HFT",
          name: process_name,
          //TODO: 参数执行确定
          args: "",
        },
        function (err) {
          if (!err) {
            console.log("start success");
            //TODO: 成功后【开启】状态更新，如进程状态，账号余额/收益情况
          }
        }
      );
    } else if (action === "stop") {
      pm2.stop(process_name, function (err) {
        if (!err) {
          console.log("stop success");
          //TODO: 成功后【关闭】 状态更新，如进程状态，账号余额/收益情况
          pm2.stop(process_name);
        }
      });
    }
  }
});
