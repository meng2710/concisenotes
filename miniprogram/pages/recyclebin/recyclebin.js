// miniprogram/pages/recyclebin/recyclebin.js
var base64 = require("../../images/base64")
Page({
  data: {
    inputShowed: false,
    inputVal: "",
    notes: [],
    disabled: true
  },
  getAlldeletednotes() {
    const that = this
    wx.showLoading({
      title: '同步中',
    })
    wx.cloud.callFunction({
      name: 'getAllnotes',
      data: {
        isDeleted: true
      },
      success: res => {
        console.log('[云函数] [getAllnotes]: ', res.result)
        if (res.result == null) {
          that.setData({
            notes: [],
            disabled: true
          })
          wx.hideLoading()
        }
        if (res.result != null) {
          that.setData({
            notes: res.result.data.reverse(),
            disabled: false
          })
          wx.hideLoading()
        }
      },
      fail: err => {
        console.error('[云函数] [getAllnotes] 调用失败', err)
        wx.hideLoading()
      }
    })
  },
  onLoad: function () {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          this.getAlldeletednotes()
        }
      }
    })
    this.setData({
      icon: base64.icon20,
      slideButtons: [{
          type: 'warn',
          text: '删除',
          extClass: 'test',
          src: '/components/cell/icon_del.svg', // icon的路径
        },
        {
          text: '还原',
          extClass: 'test',
          src: '/components/cell/icon_star.svg', // icon的路径
        }
      ],
    })
  },
  slideButtonTap(e) {
    const that = this
    var index = e.currentTarget.dataset.index
    //增加删除确认弹窗
    if (e.detail.index == 0) {
      wx.showModal({
        title: '提示',
        content: '确认彻底删除该笔记？',
        success(res) {
          if (res.confirm) {
            console.log('用户点击确定')
            wx.showLoading({
              title: '请稍等...',
            })
            //从数据库删除笔记
            const db = wx.cloud.database()
            db.collection('users').doc(that.data.notes[index]._id).remove({
              success: res => {
                wx.showToast({
                  title: '删除成功',
                })
                //删除成功后重新加载笔记页面
                that.onLoad()
                wx.hideLoading()
              },
              fail: err => {
                wx.showToast({
                  icon: 'none',
                  title: '删除失败',
                })
                wx.hideLoading()
                console.error('[数据库] [删除记录] 失败：', err)
              }
            })

          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '确认还原该笔记？',
        success(res) {
          if (res.confirm) {
            console.log('用户点击确定')
            const db = wx.cloud.database()
            db.collection('users').doc(that.data.notes[index]._id).update({
              data: {
                deleted: false
              },
              success: res => {
                // 在返回结果中会包含_id
                wx.showToast({
                  title: '笔记还原成功',
                })
                //把笔记数量保存到缓存
                try {
                  wx.setStorageSync('notesquantity', wx.getStorageSync('notesquantity') + 1)
                } catch (e) {}
                that.onLoad()
                console.log('[数据库] [更新记录] 成功', res)
              },
              fail: err => {
                wx.showToast({
                  icon: 'none',
                  title: '更新记录失败'
                })
                console.error('[数据库] [更新记录] 失败：', err)
              }
            })
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
    }
    console.log('slide button tap', e.detail)
  },
  empty() {
    const that = this
    wx.showLoading({
      title: '请稍等...',
    })
    wx.cloud.callFunction({
      name: 'empty',
      data: {},
      success: res => {
        wx.showToast({
          title: '成功清空回收站',
        })
        console.log('[云函数] [empty]: ', res.result.stats.removed)
        wx.hideLoading()
        that.onLoad()
      },
      fail: err => {
        wx.hideLoading()
        console.error('[云函数] [empty] 调用失败', err)
      }
    })
  }
});