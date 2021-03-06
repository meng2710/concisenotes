// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
exports.main = async (event, context) => {
  try {
    const result = await cloud.openapi.ocr.printedText({
        type: 'photo',
        imgUrl: event.imgUrl
      })
    console.log(result)
    return result
  } catch (err) {
    console.log(err)
    return err
  }
}