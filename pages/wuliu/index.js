const WXAPI = require('apifm-wxapi')
const app = getApp()
Page({
  data: {},
  onLoad: function (e) {
    var orderId = e.id;
    var shippderId = e.shipperid;
    this.data.orderId = orderId;
    this.data.shippderId = shippderId;
  },
  onShow: function () {
    var that = this;
    WXAPI.orderDetail(wx.getStorageSync('token'), that.data.orderId).then(function (res) {
      if (res.code != 0) {
        wx.showModal({
          title: '错误',
          content: res.msg,
          showCancel: false
        })
        return;
      }

      var logisticsTraces = new Array();
      var trackingNumber;
      var shipperName;
      let shippers = res.data.orderLogisticsShippers;
      for (let i = 0; i < shippers.length; i++) {
        let shipper = shippers[i];
        if (shipper.id == that.data.shippderId) {
          logisticsTraces = JSON.parse(shipper.traces);
          trackingNumber = shipper.trackingNumber;
          shipperName = shipper.shipperName;
        }
      }

      that.setData({
        shipperName:shipperName,
        trackingNumber: trackingNumber,
        logisticsTraces: logisticsTraces.reverse()
      });
    })
  }
})
