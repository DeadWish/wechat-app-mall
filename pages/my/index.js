const app = getApp()
const CONFIG = require('../../config.js')
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const TOOLS = require('../../utils/tools.js')

Page({
	data: {
    wxlogin: true,
    balance:0.00,
    freeze:0,
    score:0,
    score_sign_continuous:0,
    rechargeOpen: false, // 是否开启充值[预存]功能
  },
	onLoad() {
    let rechargeOpen = wx.getStorageSync('RECHARGE_OPEN')
    if (rechargeOpen && rechargeOpen == "1") {
      rechargeOpen = true
    } else {
      rechargeOpen = false
    }
    this.setData({
      rechargeOpen: rechargeOpen
    })
	},	
  onShow() {
    const _this = this
    let levelImageSrc;
    switch (wx.getStorageSync('level')) {
      case '钻石会员':
        levelImageSrc = "https://dcdn.it120.cc/2020/05/16/cec1f219-7074-4a2f-bb24-fa97202f22af.png";
        break;
      case '黄金会员':
        levelImageSrc = "https://dcdn.it120.cc/2020/05/16/03c8e56c-5f67-4248-b961-88726477b5f7.png";
        break;
      case '白银会员':
        levelImageSrc = "https://dcdn.it120.cc/2020/05/16/4ba93bd1-ec6f-437c-8e07-43d21aec4ed9.png";
        break;
      case '青铜会员':
        levelImageSrc = "https://dcdn.it120.cc/2020/05/16/f8da66ab-e165-4a25-a438-787e5e4e31ba.png";
        break;
      default:
        app.globalData.vipLevel = 0
        break;
    }
    this.setData({
      version: CONFIG.version,
      vipLevel: app.globalData.vipLevel,
      levelImageSrc: levelImageSrc,
    })
    AUTH.checkHasLogined().then(isLogined => {
      this.setData({
        wxlogin: isLogined
      })
      if (isLogined) {
        _this.getUserApiInfo();
        _this.getUserAmount();
      }
    })
    // 获取购物车数据，显示TabBarBadge
    TOOLS.showTabBarBadge();
  },
  onGotUserInfo(e){
    if (!e.detail.userInfo) {
      wx.showToast({
        title: '您已取消登录',
        icon: 'none',
      })
      return;
    }
    if (app.globalData.isConnected) {
      AUTH.register(this);
    } else {
      wx.showToast({
        title: '当前无网络',
        icon: 'none',
      })
    }
  },
  aboutUs : function () {
    wx.showModal({
      title: '关于我们',
      content: '【出岛以后】让你尝到原汁原味的海南岛特产！',
      showCancel:false
    })
  },
  loginOut(){
    AUTH.loginOut()
    wx.reLaunch({
      url: '/pages/my/index'
    })
  },
  getPhoneNumber: function(e) {
    if (!e.detail.errMsg || e.detail.errMsg != "getPhoneNumber:ok") {
      wx.showModal({
        title: '提示',
        content: e.detail.errMsg,
        showCancel: false
      })
      return;
    }
    var that = this;
    WXAPI.bindMobileWxa(wx.getStorageSync('token'), e.detail.encryptedData, e.detail.iv).then(function (res) {
      if (res.code === 10002) {
        this.setData({
          wxlogin: false
        })
        return
      }
      if (res.code == 0) {
        wx.showToast({
          title: '绑定成功',
          icon: 'success',
          duration: 2000
        })
        that.getUserApiInfo();
      } else {
        wx.showModal({
          title: '提示',
          content: '绑定失败',
          showCancel: false
        })
      }
    })
  },
  getUserApiInfo: function () {
    var that = this;
    WXAPI.userDetail(wx.getStorageSync('token')).then(function (res) {
      if (res.code == 0) {
        let _data = {}
        _data.apiUserInfoMap = res.data
        wx.setStorageSync('isSeller', res.data.base.isSeller);
        if (res.data.base.mobile) {
          _data.userMobile = res.data.base.mobile
        }
        if (res.data.userLevel) {
          _data.vipName = res.data.userLevel.name
        } else {
          _data.vipName = ""
        }

        that.setData(_data);
      }
    })
  },
  getUserAmount: function () {
    var that = this;
    WXAPI.userAmount(wx.getStorageSync('token')).then(function (res) {
      if (res.code == 0) {
        /*
        balance 可用余额
        score 可用积分
        growth 当前成长值
        totleConsumed 累计消费金额
        */
        that.setData({
          balance: res.data.balance.toFixed(2),
          freeze: res.data.freeze.toFixed(2),
          score: res.data.score
        });
      }
    })
  },
  goAsset: function () {
    wx.navigateTo({
      url: "/pages/asset/index"
    })
  },
  goScore: function () {
    wx.navigateTo({
      url: "/pages/score/index"
    })
  },
  goOrder: function (e) {
    wx.navigateTo({
      url: "/pages/order-list/index?type=" + e.currentTarget.dataset.type
    })
  },
  cancelLogin() {
    this.setData({
      wxlogin: true
    })
  },
  processLogin(e) {
    if (!e.detail.userInfo) {
      wx.showToast({
        title: '已取消',
        icon: 'none',
      })
      return;
    }
    AUTH.register(this);
  },
  getVipDetail() {
    wx.showModal({
      title: '会员说明',
      content: "订单交易成功满199元，升级白银会员，享受全场购物9.8折优惠（特价产品除外）\r\n订单交易成功满599元，升级黄金会员，享受全场购物9.6折优惠（特价产品除外）\r\n订单交易成功满1099元，升级钻石会员，享受全场购物9.5折优惠（特价产品除外）",
      showCancel:false,

    })
  },
})