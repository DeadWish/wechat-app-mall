const WXAPI = require('apifm-wxapi')
const CONFIG = require('config.js')
const AUTH = require('utils/auth')
App({
  onLaunch: function(e) {
    //初始化云开发环境
    wx.cloud.init({
      env: 'cdyh-online',
      traceUser: true
    })
  
    WXAPI.init(CONFIG.subDomain) // 从根目录的 config.js 文件中读取
    const that = this;
    // 检测新版本
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })
    /**
     * 初次加载判断网络情况
     * 无网络状态下根据实际情况进行调整
     */
    wx.getNetworkType({
      success(res) {
        const networkType = res.networkType
        if (networkType === 'none') {
          that.globalData.isConnected = false
          wx.showToast({
            title: '当前无网络',
            icon: 'loading',
            duration: 2000
          })
        }
      }
    });
    /**
     * 监听网络状态变化
     * 可根据业务需求进行调整
     */
    wx.onNetworkStatusChange(function(res) {
      if (!res.isConnected) {
        that.globalData.isConnected = false
        wx.showToast({
          title: '网络已断开',
          icon: 'loading',
          duration: 2000,
          complete: function() {
            that.goStartIndexPage()
          }
        })
      } else {
        that.globalData.isConnected = true
        wx.hideToast()
      }
    });
    //  获取接口和后台权限
    WXAPI.vipLevel().then(res => {
      that.globalData.vipLevel = res.data
    })
    //  获取商城名称
    WXAPI.queryConfigBatch('mallName,recharge_amount_min,WITHDRAW_MIN,ALLOW_SELF_COLLECTION,RECHARGE_OPEN').then(function(res) {
      if (res.code == 0) {
        res.data.forEach(config => {
          wx.setStorageSync(config.key, config.value);
          if (config.key === 'recharge_amount_min') {
            that.globalData.recharge_amount_min = res.data.value;
          }
        })
        
      }
    })
    WXAPI.scoreRules({
      code: 'goodReputation'
    }).then(function(res) {
      if (res.code == 0) {        
        that.globalData.order_reputation_score = res.data[0].score;
      }
    })
    //判断
  },
  goStartIndexPage: function() {
    setTimeout(function() {
      wx.redirectTo({
        url: "/pages/start/start"
      })
    }, 1000)
  },
  onShow (e) {
      this.globalData.launchOption = e
      // 自动登录
      AUTH.checkHasLogined().then(isLogined => {
        if (!isLogined) {
          AUTH.login()
        }
      })
      //
      let isFromOrderShare = e && e.query && e.query.inviter_id && e.query.share_order_number;
      if (isFromOrderShare) {
        wx.setStorageSync('referrer', e.query.inviter_id)
        let orderId = e.query.share_order_number;
        let shareUserName = e.query.share_user_name;
        //给点击人发红包
        //1.判断这个订单有没有超过20
        (async () => {
          const db = wx.cloud.database();
          const collection = db.collection('share_coupon_recorder');

          const total = await collection.where({
            orderid: orderId,
          }).count().then(function (res) {
            return res.total;
          }).catch(function (err) {
            console.log(err);
          })

          if (total >= 20) {
              return ;//无法继续领取
          }

          //1.判断点击人有没有领取过这个红包，通过订单号和点击人UID
          let isSendedClickUser = await collection.where({
            userid: wx.getStorageSync('uid'),
            orderid: orderId,
            type: 'click_user'
          }).limit(1).get().then(function (res) {
            if (res.data.length == 0) {
              //没有结果，证明没有发过
              return false;
            } else {
              return true;
            }
            }).catch(function (err) {
              console.log(err);
            });

          //2.没有发就发,发完以后记录,记录以后就弹窗
          if (!isSendedClickUser) {
            collection.add({
              data: {
                userid: wx.getStorageSync('uid'),
                orderid: orderId,
                type: 'click_user',
                created_at: new Date()
              }
            }).then(function () {
                //WXAPI.发送50减3的红包
                WXAPI.fetchCoupons({
                  pwd: '不告诉任何人fx9SJyr7YEUce',
                  token: wx.getStorageSync('token'),
                }).then(fetchCouopnsSuccess => {
                  if (fetchCouopnsSuccess.code == 0) {
                    //弹窗通知
                    wx.showModal({
                      title: '恭喜你！',
                      content: '获得' + shareUserName + '分享的3元红包，满50元可用！',
                      showCancel: false,
                      confirmText: "去看看",
                      success: function () {
                        wx.redirectTo({
                          url: "/pages/coupons/index?activeIndex=1"
                        })
                      }
                    })
                  }
                }).catch(function (err) {
                    console.log(err);
                });
              }).catch(function (err) {
                console.log(err);
              })
          }
        })()
      };
    },
  globalData: {                
    isConnected: true,
    launchOption: undefined,
    vipLevel: 0
  }
})