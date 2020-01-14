const WXAPI = require('apifm-wxapi')

/**
 * type: order 支付订单 recharge 充值 paybill 优惠买单
 * data: 扩展数据对象，用于保存参数
 */
function wxpay(type, money, orderId, redirectUrl, data) {
  const postData = {
    token: wx.getStorageSync('token'),
    money: money,
    remark: "在线充值",
  }
  if (type === 'order') {
    postData.remark = "支付订单 ：" + orderId;
    postData.nextAction = {
      type: 0,
      id: orderId
    };
  }
  if (type === 'paybill') {
    postData.remark = "优惠买单 ：" + data.money;
    postData.nextAction = {
      type: 4,
      uid: wx.getStorageSync('uid'),
      money: data.money
    };
  }
  postData.payName = postData.remark;
  if (postData.nextAction) {
    postData.nextAction = JSON.stringify(postData.nextAction);  
  }
  WXAPI.wxpay(postData).then(function (res) {
    if (res.code == 0) {
      // 发起支付
      wx.requestPayment({
        timeStamp: res.data.timeStamp,
        nonceStr: res.data.nonceStr,
        package: 'prepay_id=' + res.data.prepayId,
        signType: res.data.signType,
        paySign: res.data.sign,
        fail: function (aaa) {
          wx.showToast({
            title: '支付失败'
          })
        },
        success: function () {
          // 提示支付成功
          wx.showToast({
            title: '支付成功'
          })
          wx.requestSubscribeMessage({
            tmplIds: [
              '_zwDSIqsnqjawvTymPOyKJ5m-xOOshCqxwoGuQ-mkjo',
              'CMdHW6NUtX-fiDw6KOpZoOov8EEOYgdQ-g-n_OGnyQk'
            ],
            success(res) {
              // console.log('成功获取到权限')
            },
            fail(e) {
              console.error(e)
            }
          })
          wx.redirectTo({
            url: redirectUrl
          });
        }
      })
    } else {
      wx.showModal({
        title: '出错了',
        content: JSON.stringify(res),
        showCancel: false
      })
    }
  })
}

module.exports = {
  wxpay: wxpay
}