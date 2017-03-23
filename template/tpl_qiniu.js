module.exports = `const qiniu = require("qiniu"),
 config = require('../conf/config');

qiniu.conf.ACCESS_KEY = config.Qiniu.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.Qiniu.SECRET_KEY;
bucket = config.Qiniu.bucket;

/**
 * 构建上传策略函数
 */
function uptoken(key) {
  let putPolicy = new qiniu.rs.PutPolicy(bucket + ":" + key);
  return putPolicy.token();
}

function uploadToQiniu(uptoken, key, localFile, callback) {
  let extra = new qiniu.io.PutExtra();
  qiniu.io.putFile(uptoken, key, localFile, extra, (err, ret) => {
    if (!err) {
      // 上传成功， 处理返回值
      // console.log(ret.hash, ret.key, ret.persistentId);
      callback(null, ret.hash, ret.key);
    } else {
      // 上传失败， 处理返回代码
      // console.log(err);
      callback(err, null, null);
    }
  });
}

module.exports = {
  /** key       : 上传到七牛后保存的文件名
  *   filePath  : 要上传文件的本地路径
  */
  uploadFile: (key, filePath, callback) => {
    //生成上传 Token
    token = uptoken(key);
    uploadToQiniu(token, key, filePath, (err, hash, key) => {
      callback(err, hash, key);
    });
  },
  deleteFile: (key, callback) => {
    let client = new qiniu.rs.Client();
    client.remove(bucket, key, (err, ret) => {
      if ((!err)) {
        console.log('delete ok.');
      } else {
        console.log(err);
      }
      callback(err, ret);
    });
  }
};
`