const app = getApp();
const CONFIG = require('../../config.js')
const WXAPI = require('apifm-wxapi')
Page({
    data:{
      orderId:0,
      goodsList:[],
      yunPrice:"0.00",
      appid: CONFIG.appid
    },
    onLoad:function(e){
      var orderId = e.id;
      this.data.orderId = orderId;
      this.setData({
        orderId: orderId
      });
      wx.showShareMenu({
        withShareTicket: true
      })

      if (! wx.getStorageSync('nick')) {
        WXAPI.userDetail(wx.getStorageSync('token')).then(function (res) {
          if (res.code == 0) {
            wx.setStorageSync('nick', res.data.base.nick)
          } else {
            wx.setStorageSync('nick', '其他用户')
          }
        });
      }
    },
    onShow : function () {
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
        if (res.data.orderLogisticsShippers && res.data.orderLogisticsShipperLogs && res.data.goods) {
          let shippers = res.data.orderLogisticsShippers;
          let shipperLogs = res.data.orderLogisticsShipperLogs;
          let goods = res.data.goods;
          var shipperDatas = new Array();
          for (let i = 0; i < shippers.length; i++) {
            let shipper = shippers[i];
            var oneShipperData = {
              shipper: shipper
            };
          
            if (oneShipperData.shipper.traces) {
              oneShipperData.shipper.logisticsTraces = JSON.parse(shipper.traces)
            }

            for (let j = 0; j < shipperLogs.length; j++) {
              let shipperLog = shipperLogs[j];
              var shipperGoods = new Array();
              if (shipperLog.logisticsShipperId == shipper.id) {
                for (let k = 0; k < goods.length; k++) {
                  if (shipperLog.orderGoodsId == goods[k].id) {
                    //这个商品属于 这个快递 
                    shipperGoods.push(goods[k]);
                  }
                }
                oneShipperData.goods = shipperGoods;
              }
            }
            shipperDatas.push(oneShipperData);
          }
        }

        console.log(shipperDatas,'shipperDatas')
        console.log(res.data,'orderDetail')
        
        that.setData({
          shipperDatas: shipperDatas,
          orderDetail: res.data
        });
      })
      var yunPrice = parseFloat(this.data.yunPrice);
      var allprice = 0;
      var goodsList = this.data.goodsList;
      for (var i = 0; i < goodsList.length; i++) {
        allprice += parseFloat(goodsList[0].price) * goodsList[0].number;
      }
      this.setData({
        allGoodsPrice: allprice,
        yunPrice: yunPrice
      });
    },
    tapGoods: function (e) {
      if (e.currentTarget.dataset.id != 0) {
        wx.navigateTo({
          url: "/pages/goods-details/index?id=" + e.currentTarget.dataset.id
        })
      }
    },
    wuliuDetailsTap:function(e){
      let orderId = e.currentTarget.dataset.orderid;
      let shipperId = e.currentTarget.dataset.shipperid;
      wx.navigateTo({
        url: "/pages/wuliu/index?id=" + orderId + "&shipperid=" + shipperId
      })
    },
    confirmBtnTap:function(e){
      let that = this;
      let orderId = this.data.orderId;
      wx.showModal({
          title: '确认您已收到商品？',
          content: '',
          success: function(res) {
            if (res.confirm) {
              WXAPI.orderDelivery(wx.getStorageSync('token'), orderId).then(function (res) {
                if (res.code == 0) {
                  that.onShow();                  
                }
              })
            }
          }
      })
    },
    submitReputation: function (e) {
      let that = this;
      let postJsonString = {};
      postJsonString.token = wx.getStorageSync('token');
      postJsonString.orderId = this.data.orderId;
      let reputations = [];
      let i = 0;
      while (e.detail.value["orderGoodsId" + i]) {
        let orderGoodsId = e.detail.value["orderGoodsId" + i];
        let goodReputation = e.detail.value["goodReputation" + i];
        let goodReputationRemark = e.detail.value["goodReputationRemark" + i];

        let reputations_json = {};
        reputations_json.id = orderGoodsId;
        reputations_json.reputation = goodReputation;
        reputations_json.remark = goodReputationRemark;

        reputations.push(reputations_json);
        i++;
      }
      postJsonString.reputations = reputations;
      WXAPI.orderReputation({
        postJsonString: JSON.stringify(postJsonString)
      }).then(function (res) {
        if (res.code == 0) {
          that.onShow();
        }
      })
    },
  onShareAppMessage: function (res) {
    return {
      title: '我在这买了海南特产，推荐给你！20张优惠先到先得！',
      path: 'pages/index/index?inviter_id=' + wx.getStorageSync('uid') + '&share_order_number=' + this.data.orderDetail.orderInfo.orderNumber + '&share_user_name=' + wx.getStorageSync('nick'),
      imageUrl: this.data.orderDetail.goods[0].pic
    }
  }
})