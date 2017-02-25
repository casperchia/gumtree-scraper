/**
 * Created by Casper on 23/02/2017.
 */

"use strict";

const scrapeIt = require("scrape-it");
const jsonfile = require("jsonfile");

const filePath = './data.json'
const searchQuery = 'brazil argentina'
const url = `http://www.gumtree.com.au/s-${searchQuery}/k0`;

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

scrapeIt(url, scrapeModel, process);

function process(err, results) {
   var retrievedAds = toDictionary(results);
   try {
      var existingAds = jsonfile.readFileSync(filePath);
   } catch (err) {
      console.log(`Creating new file: ${filePath}`);
      jsonfile.writeFileSync(filePath, retrievedAds, {spaces: 2});
   }

   // Find which ads are new
   var newAds = {};
   for (var id in retrievedAds) {
      if (!(id in existingAds)) {
         newAds[id] = retrievedAds[id];
      }
      // Update the existing ads
      existingAds[id] = retrievedAds[id];
   }

   jsonfile.writeFileSync(filePath, existingAds, {spaces: 2});
}

function toDictionary(results) {
   var dict = {};

   if (!results || !results.ads) {
      return dict;
   }

   results.ads.forEach(function (ad) {
      if (ad.id) {
         dict[ad.id] = {
            title: ad.title,
            price: ad.price,
            url: ad.url
         }
      }
   })
   return dict;
}