// miniprogram/pages/settings/settings.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    locked: ""
  },
  emptyAll() {
    const that = this
    wx.getSetting({
      success: res => {
        if (!res.authSetting['scope.userInfo']) {
          wx.showModal({
            title: '提示',
            content: '请先登录！',
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
            title: '请稍等...',
          })
          wx.cloud.callFunction({
            name: 'emptyAll',
            data: {},
            success: res => {
              wx.hideLoading()
              wx.showToast({
                title: '清空成功！',
              })
              console.log('[云函数] [emptyAll]: ', res.result)
              //把笔记数量保存到缓存
              try {
                wx.setStorageSync('notesquantity', 0)
              } catch (e) {}
            },
            fail: err => {
              wx.hideLoading()
              console.error('[云函数] [emptyAll] 调用失败', err)
            }
          })
        }
      }
    })
  },
  lockNotespage() {
    const that = this
    //检测当前设备是否支持生物识别
    wx.checkIsSupportSoterAuthentication({
      success(res) {
        if (res.supportMode == []) {
          console.log(res.supportMode)
          wx.showModal({
            title: '提示',
            content: '您的设备不支持指纹或面容ID',
            success(res) {
              if (res.confirm) {
                console.log('用户点击确定')
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          })
        } else {
          wx.startSoterAuthentication({
            requestAuthModes: ['fingerPrint', 'facial'],
            challenge: '123456',
            authContent: '请验证指纹或面容ID',
            success(res) {
              wx.setStorageSync('isLocked', !wx.getStorageSync('isLocked'))
              if (wx.getStorageSync('isLocked')) {
                that.setData({
                  locked: "已锁定，点击解锁"
                })
              } else {
                that.setData({
                  locked: "未锁定，点击加锁"
                })
              }
            }
          })
        }
      }
    })
    console.log(wx.getStorageSync('isLocked'))
  },
  onLoad: function () {
    if (wx.getStorageSync('isLocked')) {
      this.setData({
        locked: "已锁定，点击解锁"
      })
    } else {
      this.setData({
        locked: "未锁定，点击加锁"
      })
    }
  }
})