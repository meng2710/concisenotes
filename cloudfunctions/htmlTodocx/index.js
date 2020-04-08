// 云函数入口文件
const cloud = require('wx-server-sdk')
const fs = require('fs')
var htmlDocx = require('html-docx-js')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  var docx = htmlDocx.asBlob(event.html)
  fs.writeFile("/tmp/test.docx", docx, function (err) {
    if (err) throw err
  })
  const fileStream = fs.createReadStream('/tmp/test.docx')
  var rand = "word/" + new Date().getTime() + "-" + Math.floor(Math.random() * 10) + "" + Math.floor(Math.random() * 10) + "" + Math.floor(Math.random() * 10)+".docx"
  return await cloud.uploadFile({
    cloudPath: rand,
    fileContent: fileStream
  })
}