//index.js
var notesquantity
Page({
  data: {
    nickName: '点击登录',
    avatarUrl: './user-unlogin.png',
    logged: false,
    notesquantity: 0,
    bgcolor: ""
  },

  onLoad: function () {
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                nickName: res.userInfo.nickName
              })
            }
          })
        }
      }
    })
    //获取缓存中的笔记数量
    try {
      notesquantity = wx.getStorageSync('notesquantity')
    } catch (e) {}
    if (notesquantity != "") {
      this.setData({
        notesquantity: notesquantity
      })
    }
    if (notesquantity == 0) {
      this.setData({
        notesquantity: 0
      })
    }
    console.log("当前缓存中的笔记数量是" + notesquantity + ",page data的笔记数量是" + this.data.notesquantity)
  },
  onGetUserInfo: function (e) {
    if (!this.data.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        nickName: e.detail.userInfo.nickName,
        hidden: false
      })
    }
  },
  changeBgcolor() {
    //点击背景更换随机颜色,享受点击的乐趣
    var r = Math.floor(Math.random() * (250 - 1) + 1)
    var g = Math.floor(Math.random() * (250 - 1) + 1)
    var b = Math.floor(Math.random() * (250 - 1) + 1)
    this.setData({
      bgcolor: "rgb(" + r + ", " + g + ", " + b + ")"
    })
  },
  onShow: function () {
    this.onLoad()
  }
})