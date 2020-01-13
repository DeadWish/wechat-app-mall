const WXAPI = require('apifm-wxapi')
const CONFIG = require('../../config.js')
//获取应用实例
var app = getApp();
Page({
  data: {
    banners:[],
    swiperMaxNumber: 0,
    swiperCurrent: 0,
    height: wx.getSystemInfoSync().windowHeight
  },
  onLoad:function(){
    const _this = this
    wx.switchTab({
      url: '/pages/index/index',
    });
  },
  goToIndex: function (e) {
    if (! app.globalData.isConnected) {
      wx.showToast({
        title: '当前无网络',
        icon: 'none',
      })
    }
  }
});