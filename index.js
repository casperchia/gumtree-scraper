/**
 * Created by Casper on 23/02/2017.
 */

const scrapeIt = require("scrape-it");

const url = 'http://www.gumtree.com.au/s-brazil+argentina/k0?fromSearchBox=true';
// http://www.gumtree.com.au/s-brazil+argentina/page-2/k0?fromSearchBox=true

var scrapeModel = {
   ads: {
      listItem: "#srchrslt-adtable > li",
      data: {
         id: {
            selector: ".ad-listing__watchlist.watchlist.j-watchlist",
            attr: "data-adid"
         },
         title: {
            selector: ".ad-listing__title",
         },
         price: {
            selector: ".ad-listing__price"
         },
         url: {
            selector: ".ad-listing__watchlist.watchlist.j-watchlist",
            attr: "data-adid",
            convert: id => 'http://www.gumtree.com.au/s-ad/' + id
         }
      }
   }
}

scrapeIt(url, scrapeModel, toDictionary);

function toDictionary(err, results) {
   var dict = {};
   results.ads.forEach(function (ad) {
      if (ad.id) {
         dict[ad.id] = {
            title: ad.title,
            price: ad.price,
            url: ad.url
         }
      }
   })
   console.log(dict);
}