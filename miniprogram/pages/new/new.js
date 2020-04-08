var plugin = requirePlugin("WechatSI")
let manager = plugin.getRecordRecognitionManager()
manager.onRecognize = function (res) {
  console.log("current result", res.result)
}
manager.onStop = function (res) {
  console.log("record file path", res.tempFilePath)
  console.log("result", res.result)
  wx.createSelectorQuery().select('#editor').context(function (re) {
    this.editorCtx = re.context
    //语音转文字后写入编辑器
    this.editorCtx.insertText({
      text: res.result
    })
  }).exec()
}
manager.onStart = function (res) {
  console.log("成功开始录音识别", res)
}
manager.onError = function (res) {
  console.error("error msg", res.msg)
}
var fileID = ""

Page({
  data: {
    formats: {},
    bottom: 0,
    readOnly: false,
    placeholder: '开始输入...',
    _focus: false,
    disabled: true,
    location: ""
  },
  readOnlyChange() {
    this.setData({
      readOnly: !this.data.readOnly
    })
  },
  onLoad() {
    wx.loadFontFace({
      family: 'Pacifico',
      source: '../assets/Pacifico.ttf',
      success: console.log
    })
  },
  undo() {
    this.editorCtx.undo()
  },
  redo() {
    this.editorCtx.redo()
  },
  //编辑器内容改变时触发该方法，未输入内容时提交按钮disabled
  inputChange() {
    const that = this
    this.editorCtx.getContents({
      success: function (res) {
        var content = {
          html: res.html,
          text: res.text
        }
        console.log(content.html)
        if (content.html.length > 0 && content.html != "<p><br></p>") {
          that.setData({
            disabled: false
          })
        } else {
          that.setData({
            disabled: true
          })
        }
      }
    })
  },

  onEditorReady() {
    const that = this
    wx.createSelectorQuery().select('#editor').context(function (res) {
      that.editorCtx = res.context
    }).exec()
  },
  blur() {
    this.editorCtx.blur()
  },
  format(e) {
    let {
      name,
      value
    } = e.target.dataset
    if (!name) return
    // console.log('format', name, value)
    this.editorCtx.format(name, value)

  },
  onStatusChange(e) {
    const formats = e.detail
    this.setData({
      formats
    })
  },
  insertDivider() {
    this.editorCtx.insertDivider({
      success: function () {
        console.log('insert divider success')
      }
    })
  },
  clear() {
    this.editorCtx.clear({
      success: function (res) {
        console.log("clear success")
      }
    })
  },
  removeFormat() {
    this.editorCtx.removeFormat()
  },
  insertDate() {
    const date = new Date()
    const formatDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
    this.editorCtx.insertText({
      text: formatDate
    })
  },

  //修改editor的insertImage(),使其在插入图片时将图片上传,同时替换editor里图片的本地缓存地址为网络地址。
  insertImage() {
    const that = this
    wx.chooseImage({
      count: 1,
      success: function (res) {
        const filePath = res.tempFilePaths[0]
        console.log(filePath)
        // 上传图片
        var rand = "img/" + new Date().getTime() + "-" + Math.floor(Math.random() * 10) + "" + Math.floor(Math.random() * 10) + "" + Math.floor(Math.random() * 10);
        wx.showLoading({
          title: '请稍等...',
        })
        wx.cloud.uploadFile({
          cloudPath: rand,
          filePath,
          success: res => {
            wx.hideLoading()
            that.editorCtx.insertImage({
              src: "https://636c-cloudenvir-6r3f6-1301275399.tcb.qcloud.la/" + rand,
              data: {
                id: "wuyongcanshu",
                role: 'god'
              },
              width: '80%',
              success: function (res) {
                console.log('insert image success')
              }
            })
            console.log('[上传文件] 成功：', res)
            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.hideLoading()
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })
      }
    })
  },

  //向数据库中写入笔记内容
  onAdd: function () {
    var that = this;
    var timestamp = Date.parse(new Date());
    timestamp = timestamp / 1000;
    var n = timestamp * 1000;
    var date = new Date(n);
    //年  
    var Y = date.getFullYear();
    //月  
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
    //日  
    var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    //时  
    var h = date.getHours();
    if (h < 10) {
      h = "0" + h
    }
    //分  
    var m = date.getMinutes();
    if (m < 10) {
      m = "0" + m
    }
    //秒  
    var s = date.getSeconds();
    if (s < 10) {
      s = "0" + s
    }
    var time = Y + "-" + M + "-" + D + " " + h + ":" + m + ":" + s;
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (!res.authSetting['scope.userInfo']) {
          // 未授权，提示登录
          wx.showModal({
            title: '提示',
            content: '您需要登录后才能进行该操作！',
            success(res) {
              if (res.confirm) {
                console.log('用户点击确定')
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          })
        } else {
          wx.showLoading({
            title: '请稍后...',
          })
          //获取编辑器内容并写入数据库
          this.editorCtx.getContents({
            success: function (res) {
              var content = {
                html: res.html,
                text: res.text
              }
              //获取text内容的预览，长度大于10时加省略号
              if (content.text.length > 11) {
                var preview = content.text.substring(0, 10) + "..."
              } else {
                preview = content.text
              }
              wx.serviceMarket.invokeService({
                service: 'wxee446d7507c68b11',
                api: 'msgSecCheck',
                data: {
                  "Action": "TextApproval",
                  "Text": content.text + "哈哈"
                },
              }).then(res => {
                console.log(JSON.stringify(res.data.Response.EvilTokens))
                if (JSON.stringify(res.data.Response.EvilTokens) != "[]") {
                  var evil = JSON.stringify(res.data.Response.EvilTokens[0].EvilType)
                }
                if (JSON.stringify(res.data.Response.EvilTokens) == "[]" || evil == "3" || evil == "4" || evil == "5" || evil == "6" || evil == "7" || evil == "8" || evil == "9") {
                  const db = wx.cloud.database()
                  db.collection('users').add({
                    data: {
                      html: content.html,
                      text: content.text,
                      time: time,
                      preview: preview,
                      location: that.data.location,
                      deleted: false
                    },
                    success: res => {
                      wx.hideLoading()
                      // 在返回结果中会包含新创建的记录的 _id
                      wx.showToast({
                        title: '笔记保存成功',
                      })
                      console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
                      //清空编辑器
                      that.editorCtx.clear()
                      //把笔记数量保存到缓存
                      try {
                        wx.setStorageSync('notesquantity', wx.getStorageSync('notesquantity') + 1)
                      } catch (e) {}
                    },
                    fail: err => {
                      wx.hideLoading()
                      wx.showToast({
                        icon: 'none',
                        title: '新增记录失败'
                      })
                      console.error('[数据库] [新增记录] 失败：', err)
                    }
                  })
                } else {
                  wx.hideLoading()
                  wx.showModal({
                    title: '警告',
                    content: "内容违规，无法保存！",
                  })
                }
              })
            }
          })
        }
      }
    })
  },

  addLocation() {
    const that = this
    wx.getLocation({
      type: 'gcj02', //返回可以用于wx.openLocation的经纬度
      success(res) {
        const latitude = res.latitude
        const longitude = res.longitude
        wx.chooseLocation({
          latitude,
          longitude,
          scale: 5,
          success(res) {
            const name = res.name
            const address = res.address
            console.log(name + "•" + address)
            that.setData({
              location: name
            })
          }
        })
      }
    })
  },
  voiceTotext() {
    manager.start()
    wx.showToast({
      title: '语音识别中...',
      icon: 'none',
      image: '/images/record.png',
      duration: 60000
    })
  },
  endVoice() {
    manager.stop()
    wx.hideToast()
  },
  //调用云函数实现通用印刷体OCR识别
  printedTextocr() {
    const that = this
    var rand = "img/" + new Date().getTime() + "-" + Math.floor(Math.random() * 10) + "" + Math.floor(Math.random() * 10) + "" + Math.floor(Math.random() * 10);
    wx.chooseImage({
      count: 1,
      success: function (res) {
        const filePath = res.tempFilePaths[0]
        console.log(filePath)
        wx.showLoading({
          title: 'OCR识别中...',
        })
        // 上传图片
        wx.cloud.uploadFile({
          cloudPath: rand,
          filePath,
          success: res => {
            wx.cloud.callFunction({
              name: 'printedTextocr',
              data: {
                imgUrl: "https://636c-cloudenvir-6r3f6-1301275399.tcb.qcloud.la/" + rand
              },
              success: res => {
                var text = ""
                for (var i = 0; i < res.result.items.length; i++) {
                  text = text + res.result.items[i].text
                }
                wx.createSelectorQuery().select('#editor').context(function (re) {
                  that.editorCtx = re.context
                  //OCR识别的文字写入编辑器
                  that.editorCtx.insertText({
                    text: text
                  })
                }).exec()
                wx.hideLoading()
                //识别完成后从服务器删除图片
                wx.cloud.deleteFile({
                  fileList: [fileID],
                  success: res => {
                    // handle success
                    console.log(res.fileList)
                  },
                  fail: console.error
                })
                console.log('[云函数] [printedTextocr]: ', res.result)
              },
              fail: err => {
                wx.hideLoading()
                console.error('[云函数] [printedTextocr] 调用失败', err)
              }
            })
            fileID = res.fileID
            console.log('[上传文件] 成功：', res)
            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {}
        })
      }
    })
  },
  htmlTodocx() {
    var html
    const that = this
    wx.showModal({
      title: '提示',
      content: '要将笔记导出为word文档吗？',
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '请稍等...',
          })
          console.log('用户点击确定')
          that.editorCtx.getContents({
            success: function (res) {
              html = "<html>" + res.html + "</html>"
              //调用云函数将编辑器内容从和html转为docx（使用js第三方库html-docx-js）并上传到云存储
              wx.cloud.callFunction({
                name: 'htmlTodocx',
                data: {
                  html: html
                },
                success: res => {
                  wx.cloud.downloadFile({
                    fileID: res.result.fileID,
                    success: res => {
                      const filePath = res.tempFilePath
                      wx.openDocument({
                        filePath: filePath,
                        showMenu: true,
                        success: function (res) {
                          wx.hideLoading()
                          wx.showModal({
                            title: '提示',
                            content: '此文件仅支持通过电脑打开！',
                            success(res) {
                              if (res.confirm) {
                                console.log('用户点击确定')
                              } else if (res.cancel) {
                                console.log('用户点击取消')
                              }
                            }
                          })
                        }
                      })
                    },
                    fail: err => {
                      wx.hideLoading()
                      wx.showToast({
                        title: '未知错误，请重试！',
                      })
                      // handle error
                    }
                  })
                  console.log('[云函数] [htmlTodocx]', res.result)
                },
                fail: err => {
                  wx.hideLoading()
                  wx.showToast({
                    title: '未知错误，请重试！',
                  })
                  console.error('[云函数] [htmlTodocx] 调用失败', err)
                }
              })
            }
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  }
})