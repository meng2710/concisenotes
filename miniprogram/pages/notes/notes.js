var base64 = require("../../images/base64")
Page({
    data: {
        inputShowed: false,
        inputVal: "",
        notes: [],
        isLocked: false
    },
    search: function (value) {
        var array = [] //数组array用于存放搜索结果
        const that = this
        wx.getSetting({
            success: res => {
                if (res.authSetting['scope.userInfo']) {
                    //搜索功能的实现
                    wx.cloud.callFunction({
                        name: 'getAllnotes',
                        data: {
                            isDeleted: false
                        },
                        success: res => {
                            console.log('[云函数] [getAllnotes]: ', res.result)
                            if (res.result != null) {
                                for (var i = 0, j = 0; i < res.result.data.length; i++) {
                                    if (res.result.data[i].text.indexOf(value) != -1) {
                                        array[j] = res.result.data[i]
                                        j++
                                    }
                                }
                                that.setData({
                                    notes: array.reverse()
                                })
                            }
                        },
                        fail: err => {
                            console.error('[云函数] [getAllnotes] 调用失败', err)
                        }
                    })
                }
            }
        })
        return new Promise((resolve, reject) => {}) //不再使用此自带方法显示搜索结果
    },
    //调用云函数获取用户所有未删除笔记
    getAllnotes() {
        const that = this
        if (that.data.isLocked) {
            wx.showModal({
                title: '提示',
                content: '页面已锁定，是否解锁',
                success(res) {
                    if (res.confirm) {
                        wx.startSoterAuthentication({
                            requestAuthModes: ['fingerPrint', 'facial'],
                            challenge: '123456',
                            authContent: '请使用指纹或面容ID解锁',
                            success(res) {
                                that.setData({
                                    isLocked: false
                                })
                                wx.showLoading({
                                    title: '同步中',
                                })
                                wx.cloud.callFunction({
                                    name: 'getAllnotes',
                                    data: {
                                        isDeleted: false
                                    },
                                    success: res => {
                                        console.log('[云函数] [getAllnotes]: ', res.result)
                                        if (res.result == null) {
                                            that.setData({
                                                notes: []
                                            })
                                            //把笔记数量保存到缓存
                                            try {
                                                wx.setStorageSync('notesquantity', 0)
                                            } catch (e) {}
                                            wx.hideLoading()
                                        }
                                        if (res.result != null) {
                                            that.setData({
                                                notes: res.result.data.reverse()
                                            })
                                            //把笔记数量保存到缓存
                                            try {
                                                wx.setStorageSync('notesquantity', res.result.data.length)
                                            } catch (e) {}
                                            wx.hideLoading()
                                        }
                                    },
                                    fail: err => {
                                        wx.hideLoading()
                                        console.error('[云函数] [getAllnotes] 调用失败', err)
                                    }
                                })
                            }
                        })
                        console.log('用户点击确定' + that.data.isLocked)
                    } else if (res.cancel) {
                        console.log('用户点击取消')
                    }
                }
            })
        } else {
            wx.showLoading({
                title: '同步中',
            })
            wx.cloud.callFunction({
                name: 'getAllnotes',
                data: {
                    isDeleted: false
                },
                success: res => {
                    console.log('[云函数] [getAllnotes]: ', res.result)
                    if (res.result == null) {
                        that.setData({
                            notes: []
                        })
                        //把笔记数量保存到缓存
                        try {
                            wx.setStorageSync('notesquantity', 0)
                        } catch (e) {}
                        wx.hideLoading()
                    }
                    if (res.result != null) {
                        that.setData({
                            notes: res.result.data.reverse()
                        })
                        //把笔记数量保存到缓存
                        try {
                            wx.setStorageSync('notesquantity', res.result.data.length)
                        } catch (e) {}
                        wx.hideLoading()
                    }
                },
                fail: err => {
                    console.error('[云函数] [getAllnotes] 调用失败', err)
                }
            })
        }
    },
    slideButtonTap(e) {
        const that = this
        var index = e.currentTarget.dataset.index
        var html
        //增加删除确认弹窗
        if (e.detail.index == 0) {
            wx.showModal({
                title: '提示',
                content: '确认删除该笔记？',
                success(res) {
                    if (res.confirm) {
                        console.log('用户点击确定')
                        //数据库标记笔记为删除状态
                        const db = wx.cloud.database()
                        db.collection('users').doc(that.data.notes[index]._id).update({
                            data: {
                                deleted: true
                            },
                            success: res => {
                                // 在返回结果中会包含_id
                                wx.showToast({
                                    title: '成功移动到回收站',
                                })
                                that.onShow()
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
        } else {
            wx.showModal({
                title: '提示',
                content: '要将笔记导出为word文档吗？',
                success(res) {
                    if (res.confirm) {
                        wx.showLoading({
                            title: '请稍等...',
                        })
                        console.log('用户点击确定')
                        html = "<html>" + that.data.notes[index].html + "</html>"
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
                    } else if (res.cancel) {
                        console.log('用户点击取消')
                    }
                }
            })
        }
        console.log('slide button tap', e.detail)
    },
    onLoad: function (){
        this.setData({
            search: this.search.bind(this),
            icon: base64.icon20,
            slideButtons: [{
                    type: 'warn',
                    text: '删除',
                    extClass: 'test',
                    src: '/components/cell/icon_del.svg', // icon的路径
                },
                {
                    text: '导出',
                    extClass: 'test',
                    src: '/components/cell/icon_star.svg', // icon的路径
                }
            ],
            isLocked: wx.getStorageSync('isLocked')
        })
    },
    onShow: function () {
        // 获取用户信息
        wx.getSetting({
            success: res => {
                if (res.authSetting['scope.userInfo']) {
                    this.getAllnotes()
                }
            }
        })
    }
})